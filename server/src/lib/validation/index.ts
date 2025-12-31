// Validation Library - Barrel Export
export * from "./kingdom.schemas";

// ============ VALIDATION HELPERS ============

import { ZodError, ZodSchema } from "zod";
import { Socket } from "socket.io";

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Valida dados usando um schema Zod
 */
export function validate<T>(
  schema: ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (err) {
    if (err instanceof ZodError) {
      const firstError = err.issues[0];
      const path = firstError.path.join(".");
      const message = path
        ? `${path}: ${firstError.message}`
        : firstError.message;
      return { success: false, error: message };
    }
    return { success: false, error: "Erro de validação desconhecido" };
  }
}

/**
 * Valida e emite erro se inválido
 * Retorna os dados validados ou null se inválido
 */
export function validateOrEmitError<T>(
  socket: Socket,
  schema: ZodSchema<T>,
  data: unknown,
  errorEvent: string = "kingdom:error"
): T | null {
  const result = validate(schema, data);

  if (!result.success) {
    socket.emit(errorEvent, {
      message: result.error,
      code: "VALIDATION_ERROR",
    });
    return null;
  }

  return result.data!;
}
