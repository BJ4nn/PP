export function translateCompanyApplicationError(message: string) {
  if (message.includes("Worker already confirmed for overlapping shift")) {
    return "Pracovník už má potvrdenú inú zmenu v rovnakom čase.";
  }
  if (message.includes("Job is no longer active")) {
    return "Zmena už nie je aktívna.";
  }
  if (message.includes("Application not found")) {
    return "Prihláška sa nenašla.";
  }
  if (message.includes("Use cancel for confirmed applications")) {
    return "Potvrdenú prihlášku treba zrušiť, nie zamietnuť.";
  }
  return message || "Nepodarilo sa uložiť zmenu.";
}

