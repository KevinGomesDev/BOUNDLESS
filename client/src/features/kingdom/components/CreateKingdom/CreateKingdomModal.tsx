import React, { useState, useEffect } from "react";
import { useKingdom } from "../../hooks/useKingdom";
import { socketService } from "../../../../services/socket.service";
import { Step1Kingdom } from "./Step1Kingdom";
import { Step2Regent } from "./Step2Regent";
import { Step3Troops } from "./Step3Troops";
import type {
  Race,
  Alignment,
  GameClass,
  TroopPassive,
  TroopTemplate,
} from "./types";

interface CreateKingdomModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type Step = "kingdom" | "regent" | "troops";

const createEmptyTemplate = (
  slotIndex: number,
  passiveId?: string
): TroopTemplate => ({
  slotIndex,
  name: `Tropa ${slotIndex + 1}`,
  passiveId: passiveId || "",
  resourceType: ["ore", "supplies", "arcane", "experience", "devotion"][
    slotIndex % 5
  ] as any,
  combat: 2,
  acuity: 2,
  focus: 2,
  armor: 2,
  vitality: 2,
});

export const CreateKingdomModal: React.FC<CreateKingdomModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const {
    createKingdom,
    state: { isLoading: isCreatingKingdom, error: kingdomError },
  } = useKingdom();
  const [currentStep, setCurrentStep] = useState<Step>("kingdom");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Kingdom State - com valores padrão
  const [kingdomName, setKingdomName] = useState("Kingdom of Ashburn");
  const [capitalName, setCapitalName] = useState("Ashburn Capital");
  const [selectedRace, setSelectedRace] = useState<string>("HUMANOIDE");
  const [selectedAlignment, setSelectedAlignment] = useState<string>("CAOS");

  // Regent State - com valores padrão distribuídos
  const [regentName, setRegentName] = useState("Lord Ashburn");
  const [selectedClass, setSelectedClass] = useState<string>("WARRIOR");
  const [regentAttributes, setRegentAttributes] = useState({
    combat: 7,
    acuity: 5,
    focus: 5,
    armor: 4,
    vitality: 4,
  });

  // Troops State - com nomes padrão
  const [troopTemplates, setTroopTemplates] = useState<TroopTemplate[]>([
    createEmptyTemplate(0),
    createEmptyTemplate(1),
    createEmptyTemplate(2),
    createEmptyTemplate(3),
    createEmptyTemplate(4),
  ]);

  // Data State
  const [races, setRaces] = useState<Race[]>([]);
  const [alignments, setAlignments] = useState<Alignment[]>([]);
  const [classes, setClasses] = useState<GameClass[]>([]);
  const [troopPassives, setTroopPassives] = useState<TroopPassive[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Load initial data
  useEffect(() => {
    let isMounted = true;
    let racesLoaded = false;
    let alignmentsLoaded = false;
    let classesLoaded = false;
    let passivesLoaded = false;

    const checkComplete = () => {
      if (
        racesLoaded &&
        alignmentsLoaded &&
        classesLoaded &&
        passivesLoaded &&
        isMounted
      ) {
        setIsLoadingData(false);
      }
    };

    const handleRacesData = (data: Race[]) => {
      if (!isMounted) return;
      setRaces(data);
      racesLoaded = true;
      checkComplete();
    };

    const handleAlignmentsData = (data: Alignment[]) => {
      if (!isMounted) return;
      setAlignments(data);
      alignmentsLoaded = true;
      checkComplete();
    };

    const handleClassesData = (data: { classes: GameClass[] }) => {
      if (!isMounted) return;
      setClasses(data.classes || []);
      classesLoaded = true;
      checkComplete();
    };

    const handlePassivesData = (data: TroopPassive[]) => {
      if (!isMounted) return;
      setTroopPassives(data);

      // Auto-selecionar passivas padrão para cada tropa (primeira disponível por tipo)
      if (data.length > 0) {
        setTroopTemplates((prev) =>
          prev.map((t, idx) => ({
            ...t,
            passiveId: data[idx % data.length]?.id || "",
          }))
        );
      }

      passivesLoaded = true;
      checkComplete();
    };

    socketService.on("kingdom:races_data", handleRacesData);
    socketService.on("kingdom:alignments_data", handleAlignmentsData);
    socketService.on("skills:classes_list", handleClassesData);
    socketService.on("kingdom:troop_passives_data", handlePassivesData);

    socketService.emit("kingdom:get_races");
    socketService.emit("kingdom:get_alignments");
    socketService.emit("skills:list_classes");
    socketService.emit("kingdom:get_troop_passives");

    const timeout = setTimeout(() => {
      if (isMounted) setIsLoadingData(false);
    }, 8000);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      socketService.off("kingdom:races_data", handleRacesData);
      socketService.off("kingdom:alignments_data", handleAlignmentsData);
      socketService.off("skills:classes_list", handleClassesData);
      socketService.off("kingdom:troop_passives_data", handlePassivesData);
    };
  }, []);

  const handleNextToRegent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kingdomName || !capitalName || !selectedRace || !selectedAlignment) {
      return;
    }
    setCurrentStep("regent");
  };

  const handleNextToTroops = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regentName || !selectedClass) {
      return;
    }
    const totalPoints = Object.values(regentAttributes).reduce(
      (a, b) => a + b,
      0
    );
    if (totalPoints !== 30) {
      return;
    }
    setCurrentStep("troops");
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Step 1: Create Kingdom
      const kingdomResult = await createKingdom({
        name: kingdomName,
        capitalName,
        race: selectedRace,
        alignment: selectedAlignment,
      });

      if (!kingdomResult || !("id" in kingdomResult)) {
        throw new Error("Falha ao criar o reino");
      }

      const kingdomId = kingdomResult.id;

      // Step 2: Create Regent
      await new Promise<void>((resolve, reject) => {
        const successHandler = () => {
          socketService.off("army:recruit_regent_success", successHandler);
          socketService.off("error", errorHandler);
          resolve();
        };

        const errorHandler = (data: any) => {
          socketService.off("army:recruit_regent_success", successHandler);
          socketService.off("error", errorHandler);
          reject(new Error(data.message || "Erro ao criar regente"));
        };

        socketService.on("army:recruit_regent_success", successHandler);
        socketService.on("error", errorHandler);

        socketService.emit("army:recruit_regent", {
          name: regentName,
          class: selectedClass,
          attributeDistribution: regentAttributes,
        });

        setTimeout(() => {
          socketService.off("army:recruit_regent_success", successHandler);
          socketService.off("error", errorHandler);
          reject(new Error("Timeout ao criar regente"));
        }, 10000);
      });

      // Step 3: Create Troop Templates
      await new Promise<void>((resolve, reject) => {
        const successHandler = () => {
          socketService.off(
            "kingdom:set_troop_templates_success",
            successHandler
          );
          socketService.off("error", errorHandler);
          resolve();
        };

        const errorHandler = (data: any) => {
          socketService.off(
            "kingdom:set_troop_templates_success",
            successHandler
          );
          socketService.off("error", errorHandler);
          reject(
            new Error(data.message || "Erro ao criar templates de tropas")
          );
        };

        socketService.on("kingdom:set_troop_templates_success", successHandler);
        socketService.on("error", errorHandler);

        socketService.emit("kingdom:set_troop_templates", {
          kingdomId,
          templates: troopTemplates,
        });

        setTimeout(() => {
          socketService.off(
            "kingdom:set_troop_templates_success",
            successHandler
          );
          socketService.off("error", errorHandler);
          reject(new Error("Timeout ao criar templates de tropas"));
        }, 10000);
      });

      onSuccess();
    } catch (err: any) {
      console.error("Error creating kingdom:", err);
      setSubmitError(err.message || "Erro ao criar reino");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateRegentAttribute = (
    key: "combat" | "acuity" | "focus" | "armor" | "vitality",
    value: number
  ) => {
    setRegentAttributes((prev) => ({
      ...prev,
      [key]: Math.max(0, Math.min(30, value)),
    }));
  };

  const regentTotalPoints = Object.values(regentAttributes).reduce(
    (a, b) => a + b,
    0
  );
  const currentError = submitError || kingdomError;
  const isLoading = isSubmitting || isCreatingKingdom;

  const getStepNumber = () => {
    switch (currentStep) {
      case "kingdom":
        return 1;
      case "regent":
        return 2;
      case "troops":
        return 3;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case "kingdom":
        return "Criar Reino";
      case "regent":
        return "Criar Regente";
      case "troops":
        return "Configurar Tropas";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>

      <div className="relative bg-slate-800 border border-slate-600 p-6 sm:p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          ✕
        </button>

        <div className="flex gap-2 mb-6">
          <div
            className={`flex-1 h-1 ${
              currentStep === "kingdom" ? "bg-blue-500" : "bg-green-500"
            }`}
          ></div>
          <div
            className={`flex-1 h-1 ${
              currentStep === "regent"
                ? "bg-blue-500"
                : currentStep === "troops"
                ? "bg-green-500"
                : "bg-slate-600"
            }`}
          ></div>
          <div
            className={`flex-1 h-1 ${
              currentStep === "troops" ? "bg-blue-500" : "bg-slate-600"
            }`}
          ></div>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white">{getStepTitle()}</h2>
          <p className="text-slate-400 mt-1 text-sm">
            Passo {getStepNumber()} de 3
          </p>
        </div>

        {isLoadingData ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full mb-4"></div>
            <p className="text-slate-400">Carregando dados...</p>
          </div>
        ) : (
          <>
            {currentStep === "kingdom" && (
              <Step1Kingdom
                kingdomName={kingdomName}
                setKingdomName={setKingdomName}
                capitalName={capitalName}
                setCapitalName={setCapitalName}
                selectedRace={selectedRace}
                setSelectedRace={setSelectedRace}
                selectedAlignment={selectedAlignment}
                setSelectedAlignment={setSelectedAlignment}
                races={races}
                alignments={alignments}
                error={currentError}
                isLoading={isLoading}
                onNext={handleNextToRegent}
                onCancel={onClose}
              />
            )}

            {currentStep === "regent" && (
              <Step2Regent
                regentName={regentName}
                setRegentName={setRegentName}
                selectedClass={selectedClass}
                setSelectedClass={setSelectedClass}
                attributes={regentAttributes}
                updateAttribute={updateRegentAttribute}
                classes={classes}
                error={currentError}
                isLoading={isLoading}
                totalPoints={regentTotalPoints}
                onSubmit={handleNextToTroops}
                onBack={() => setCurrentStep("kingdom")}
              />
            )}

            {currentStep === "troops" && (
              <Step3Troops
                templates={troopTemplates}
                setTemplates={setTroopTemplates}
                passives={troopPassives}
                error={currentError}
                isLoading={isLoading}
                onSubmit={handleFinalSubmit}
                onBack={() => setCurrentStep("regent")}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};
