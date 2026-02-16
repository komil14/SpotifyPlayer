export interface LyricLine {
    time: number; // Time in milliseconds
    text: string;
  }
  
  export const parseLRC = (lrcString: string): LyricLine[] => {
    const lines = lrcString.split('\n');
    const regex = /^\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)$/;
  
    return lines
      .map((line) => {
        const match = line.match(regex);
        if (!match) return null;
  
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const milliseconds = parseInt(match[3].padEnd(3, '0'), 10); // Ensure 3 digits
  
        const totalTime = minutes * 60 * 1000 + seconds * 1000 + milliseconds;
        const text = match[4].trim();
  
        return { time: totalTime, text };
      })
      .filter((line): line is LyricLine => line !== null && line.text !== '');
  };