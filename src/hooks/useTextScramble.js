import React, { useState, useEffect, useRef } from 'react';

    const useTextScramble = (phrases, interval = 100, scrambleDuration = 200) => {
      const [currentPhrase, setCurrentPhrase] = useState(phrases[0]);
      const [display_text, setDisplayText] = useState(phrases[0]);
      const [phraseIndex, setPhraseIndex] = useState(0);
      const isMounted = useRef(true);
      const animationFrameId = useRef();
      const lastUpdateTime = useRef(0);

      useEffect(() => {
        isMounted.current = true;
        return () => {
          isMounted.current = false;
          if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
          }
        };
      }, []);

      const scramble = (text) => {
        const chars = '!<>-_\\/[]{}—=+*^?#________';
        let frame = 0;
        const totalFrames = scrambleDuration / (1000 / 60); 

        const animate = (currentTime) => {
          if (!isMounted.current) return;

          if (!lastUpdateTime.current) lastUpdateTime.current = currentTime;
          const deltaTime = currentTime - lastUpdateTime.current;

          if (deltaTime > interval / 2) {
            frame++;
            const progress = frame / totalFrames;
            let newText = '';
            for (let i = 0; i < text.length; i++) {
              const from = text[i];
              const to = Math.random() < 0.5 ? '0' : '1';
              const isScrambled = Math.random() > progress;
              newText += isScrambled ? to : from;
            }
            setDisplayText(newText);
            lastUpdateTime.current = currentTime;
          }

          if (frame < totalFrames) {
            animationFrameId.current = requestAnimationFrame(animate);
          } else {
            setDisplayText(text);
          }
        };
        animationFrameId.current = requestAnimationFrame(animate);
      };

      const next = () => {
        const nextIndex = (phraseIndex + 1) % phrases.length;
        setPhraseIndex(nextIndex);
        const nextPhrase = phrases[nextIndex];
        setCurrentPhrase(nextPhrase);
        scramble(nextPhrase);
      };

      useEffect(() => {
        if (animationFrameId.current) {
          cancelAnimationFrame(animationFrameId.current);
        }
        scramble(currentPhrase);
      }, [currentPhrase]);

      return [display_text, next];
    };

    export default useTextScramble;