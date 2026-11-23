export const recoveryMessage = "Se existir uma conta ativa com este e-mail, você receberá instruções para redefinir sua senha.";
export function validResetToken(token) { return /^[A-Za-z0-9_-]{43}$/.test(token); }
export function passwordConfirmationError(password, confirmation) {
  if (password.length < 8 || password.length > 128 || !password.trim()) return "A senha deve ter entre 8 e 128 caracteres e não pode conter apenas espaços.";
  return password === confirmation ? "" : "As senhas precisam ser iguais.";
}
