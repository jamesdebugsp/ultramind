/**
 * Sanitizes database and API error messages to prevent information leakage.
 * Returns user-friendly messages while logging the actual error for debugging.
 */
export function getUserFriendlyError(error: unknown): string {
  // Log the actual error for debugging purposes
  console.error('Internal error:', error);
  
  // Extract message from various error types
  const msg = getErrorMessage(error).toLowerCase();
  
  // Handle common database and authentication errors
  if (msg.includes('not found') || msg.includes('no rows')) {
    return 'Registro não encontrado';
  }
  
  if (msg.includes('permission') || msg.includes('policy') || msg.includes('denied')) {
    return 'Operação não permitida';
  }
  
  if (msg.includes('unique') || msg.includes('duplicate') || msg.includes('already exists')) {
    return 'Esse registro já existe';
  }
  
  if (msg.includes('foreign key') || msg.includes('referenced by')) {
    return 'Não é possível excluir este item pois está vinculado a outros registros';
  }
  
  if (msg.includes('constraint')) {
    return 'Os dados informados não são válidos';
  }
  
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('connection')) {
    return 'Erro de conexão. Verifique sua internet e tente novamente';
  }
  
  if (msg.includes('timeout')) {
    return 'A operação demorou muito. Tente novamente';
  }
  
  if (msg.includes('unauthorized') || msg.includes('unauthenticated') || msg.includes('jwt')) {
    return 'Sessão expirada. Por favor, faça login novamente';
  }
  
  if (msg.includes('invalid') || msg.includes('validation')) {
    return 'Os dados informados são inválidos';
  }
  
  if (msg.includes('too many') || msg.includes('rate limit')) {
    return 'Muitas tentativas. Aguarde um momento e tente novamente';
  }
  
  // Default generic message for all other errors
  return 'Ocorreu um erro. Tente novamente';
}

/**
 * Extracts error message from various error object types
 */
function getErrorMessage(error: unknown): string {
  if (error === null || error === undefined) {
    return '';
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'object') {
    const errorObj = error as Record<string, unknown>;
    
    // Check common error message properties
    if (typeof errorObj.message === 'string') {
      return errorObj.message;
    }
    
    if (typeof errorObj.error === 'string') {
      return errorObj.error;
    }
    
    if (typeof errorObj.error === 'object' && errorObj.error !== null) {
      const nestedError = errorObj.error as Record<string, unknown>;
      if (typeof nestedError.message === 'string') {
        return nestedError.message;
      }
    }
    
    // Supabase error format
    if (typeof errorObj.details === 'string') {
      return errorObj.details;
    }
  }
  
  return 'Unknown error';
}

/**
 * Creates a user-friendly error object for form validation failures
 */
export function createValidationError(fieldErrors: Record<string, string>): string {
  const firstError = Object.values(fieldErrors)[0];
  return firstError || 'Por favor, verifique os campos e tente novamente';
}
