// src/lib/speaker.ts

export const speak = (text: string) => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }

  // Cancel any ongoing speech so instructions flow naturally without overlapping
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  
  // Tuning for a softer, smoother, and lighter tone
  utterance.rate = 0.92;  // Slightly slower, calm pacing
  utterance.pitch = 1.25; // Higher pitch for a softer, lighter voice
  utterance.volume = 0.9; // Comfortable volume
  utterance.lang = "en-US";

  // Attempt to pick a smooth, natural-sounding female system voice
  const voices = window.speechSynthesis.getVoices();
  const softVoice = voices.find(
    (v) => 
      v.lang.includes("en") && 
      (v.name.includes("Google US English") || 
       v.name.includes("Samantha") || 
       v.name.includes("Zira") ||
       v.name.includes("Natural") ||
       v.name.includes("Female"))
  );

  if (softVoice) {
    utterance.voice = softVoice;
  }

  window.speechSynthesis.speak(utterance);
};
