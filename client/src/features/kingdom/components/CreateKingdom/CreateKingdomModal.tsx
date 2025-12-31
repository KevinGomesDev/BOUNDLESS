import React, { useEffect } from "react";
import { useKingdom, useKingdomStaticData } from "../../hooks/useKingdom";
import {
  useKingdomForm,
  useRegentForm,
  useTroopsForm,
  useCreationWizard,
} from "../../hooks/useKingdomForm";
import { socketService } from "@/services/socket.service";
import { Step1Kingdom } from "./Step1Kingdom";
import { Step2Regent } from "./Step2Regent";
import { Step3Troops } from "./Step3Troops";
import { TemplateSelection } from "./TemplateSelection";
import { LoadingSpinner, StepIndicator, Breadcrumb } from "../ui";

interface CreateKingdomModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateKingdomModal: React.FC<CreateKingdomModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const {
    createKingdom,
    isLoading: isCreatingKingdom,
    error: kingdomError,
  } = useKingdom();

  // Form hooks
  const kingdomForm = useKingdomForm();
  const regentForm = useRegentForm();
  const troopsForm = useTroopsForm();
  const wizard = useCreationWizard();

  // Static data
  const staticData = useKingdomStaticData();

  // Load static data on mount
  useEffect(() => {
    staticData.loadAll().then((data) => {
      if (data && data.passives.length > 0) {
        troopsForm.setPassiveIds(data.passives.map((p) => p.id));
      }
    });
  }, []);

  // Step handlers
  const handleNextToRegent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kingdomForm.isValid) return;
    wizard.nextStep();
  };

  const handleNextToTroops = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regentForm.isValid) return;
    wizard.nextStep();
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!troopsForm.allValid) return;

    wizard.startSubmit();

    try {
      // Create kingdom with troops
      await createKingdom({
        name: kingdomForm.data.name,
        capitalName: kingdomForm.data.capitalName,
        race: kingdomForm.data.race as any,
        alignment: kingdomForm.data.alignment as any,
        raceMetadata: kingdomForm.data.raceMetadata,
        troopTemplates: troopsForm.templates.map((t) => ({
          slotIndex: t.slotIndex,
          name: t.name,
          passiveId: t.passiveId,
          resourceType: t.resourceType,
          combat: t.combat,
          acuity: t.acuity,
          focus: t.focus,
          armor: t.armor,
          vitality: t.vitality,
        })),
      });

      // Create regent via socket (separate endpoint)
      await new Promise<void>((resolve, reject) => {
        const cleanup = () => {
          socketService.off("army:recruit_regent_success", successHandler);
          socketService.off("error", errorHandler);
        };

        const successHandler = () => {
          cleanup();
          resolve();
        };

        const errorHandler = (data: { message: string }) => {
          cleanup();
          reject(new Error(data.message));
        };

        socketService.on("army:recruit_regent_success", successHandler);
        socketService.on("error", errorHandler);

        socketService.emit("army:recruit_regent", {
          name: regentForm.data.name,
          class: regentForm.data.classCode,
          attributeDistribution: regentForm.data.attributes,
        });

        setTimeout(() => {
          cleanup();
          reject(new Error("Timeout ao criar regente"));
        }, 15000);
      });

      onSuccess();
    } catch (err: any) {
      wizard.endSubmit(err.message || "Erro ao criar reino");
    }
  };

  const handleTemplateSuccess = () => {
    onSuccess();
  };

  const currentError = wizard.submitError || kingdomError;
  const isLoading = wizard.isSubmitting || isCreatingKingdom;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-citadel-obsidian/90 via-black/80 to-citadel-obsidian/90 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className="relative bg-gradient-to-b from-citadel-granite via-citadel-carved to-citadel-obsidian 
                      border-2 border-metal-iron shadow-2xl rounded-2xl
                      w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <ModalHeader
          title={
            wizard.view === "templates"
              ? "⚔️ Fundar Novo Reino ⚔️"
              : getStepTitle(wizard.step)
          }
          showBreadcrumb={wizard.view === "custom"}
          currentStep={wizard.stepNumber - 1}
          onClose={onClose}
        />

        {/* Progress Bar */}
        {wizard.view === "custom" && (
          <div className="px-6 pt-4">
            <StepIndicator
              steps={["Reino", "Regente", "Tropas"]}
              currentStep={wizard.stepNumber - 1}
            />
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {wizard.view === "templates" && (
            <TemplateSelection
              onSelectTemplate={handleTemplateSuccess}
              onCustomCreate={wizard.goToCustom}
            />
          )}

          {wizard.view === "custom" && (
            <>
              {staticData.isLoading ? (
                <LoadingSpinner message="Carregando dados do reino..." />
              ) : (
                <>
                  {wizard.step === "kingdom" && (
                    <Step1Kingdom
                      kingdomName={kingdomForm.data.name}
                      setKingdomName={(v) => kingdomForm.update({ name: v })}
                      capitalName={kingdomForm.data.capitalName}
                      setCapitalName={(v) =>
                        kingdomForm.update({ capitalName: v })
                      }
                      selectedRace={kingdomForm.data.race}
                      setSelectedRace={(v) => kingdomForm.update({ race: v })}
                      selectedAlignment={kingdomForm.data.alignment}
                      setSelectedAlignment={(v) =>
                        kingdomForm.update({ alignment: v })
                      }
                      races={staticData.races}
                      alignments={staticData.alignments}
                      error={currentError}
                      isLoading={isLoading}
                      onNext={handleNextToRegent}
                      onCancel={wizard.goToTemplates}
                    />
                  )}

                  {wizard.step === "regent" && (
                    <Step2Regent
                      regentName={regentForm.data.name}
                      setRegentName={(v) => regentForm.update({ name: v })}
                      selectedClass={regentForm.data.classCode}
                      setSelectedClass={(v) =>
                        regentForm.update({ classCode: v })
                      }
                      attributes={regentForm.data.attributes}
                      updateAttribute={regentForm.updateAttribute}
                      classes={staticData.classes}
                      error={currentError}
                      isLoading={isLoading}
                      totalPoints={regentForm.totalPoints}
                      onSubmit={handleNextToTroops}
                      onBack={wizard.prevStep}
                    />
                  )}

                  {wizard.step === "troops" && (
                    <Step3Troops
                      templates={troopsForm.templates}
                      setTemplates={() => {}} // Not used with new hook
                      passives={staticData.passives}
                      error={currentError}
                      isLoading={isLoading}
                      onSubmit={handleFinalSubmit}
                      onBack={wizard.prevStep}
                      // New props for hook integration
                      activeSlot={troopsForm.activeSlot}
                      setActiveSlot={troopsForm.setActiveSlot}
                      updateTemplate={troopsForm.updateTemplate}
                      updateAttribute={troopsForm.updateAttribute}
                    />
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer Line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-metal-iron/30 to-transparent" />
      </div>
    </div>
  );
};

// ============ HELPER COMPONENTS ============

interface ModalHeaderProps {
  title: string;
  showBreadcrumb: boolean;
  currentStep: number;
  onClose: () => void;
}

const ModalHeader: React.FC<ModalHeaderProps> = ({
  title,
  showBreadcrumb,
  currentStep,
  onClose,
}) => (
  <div
    className="relative bg-gradient-to-r from-citadel-obsidian via-citadel-slate to-citadel-obsidian 
                  border-b border-metal-iron/50 px-6 py-4"
  >
    {/* Corner Decorations */}
    <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-metal-gold/50 rounded-tl-lg" />
    <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-metal-gold/50 rounded-tr-lg" />

    {/* Title */}
    <h1
      className="text-center text-2xl font-bold text-parchment-light tracking-wider"
      style={{ fontFamily: "'Cinzel', serif" }}
    >
      {title}
    </h1>

    {/* Breadcrumb */}
    {showBreadcrumb && (
      <Breadcrumb
        items={["Reino", "Regente", "Tropas"]}
        currentIndex={currentStep}
      />
    )}

    {/* Close Button */}
    <button
      onClick={onClose}
      className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center
                 text-parchment-dark hover:text-war-ember transition-colors
                 border border-metal-iron/50 rounded-lg hover:border-war-ember/50"
    >
      ✕
    </button>
  </div>
);

function getStepTitle(step: string): string {
  switch (step) {
    case "kingdom":
      return "Criar Reino";
    case "regent":
      return "Criar Regente";
    case "troops":
      return "Configurar Tropas";
    default:
      return "Criar Reino";
  }
}
