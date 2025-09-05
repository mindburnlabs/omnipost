"use client";

import { useState, useEffect } from "react";

export function useTypewriter(
  words: string[],
  typeSpeed: number = 100,
  deleteSpeed: number = 50,
  delayBetweenWords: number = 2000
) {
  const [displayedText, setDisplayedText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[wordIndex];

    const timer = setTimeout(() => {
      if (!isDeleting) {
        // Typing
        if (displayedText.length < currentWord.length) {
          setDisplayedText(currentWord.substring(0, displayedText.length + 1));
        } else {
          // Finished typing, wait then start deleting
          setTimeout(() => setIsDeleting(true), delayBetweenWords);
        }
      } else {
        // Deleting
        if (displayedText.length > 0) {
          setDisplayedText(currentWord.substring(0, displayedText.length - 1));
        } else {
          // Finished deleting, move to next word
          setIsDeleting(false);
          setWordIndex((prev) => (prev + 1) % words.length);
        }
      }
    }, isDeleting ? deleteSpeed : typeSpeed);

    return () => clearTimeout(timer);
  }, [displayedText, wordIndex, isDeleting, words, typeSpeed, deleteSpeed, delayBetweenWords]);

  return displayedText;
}
