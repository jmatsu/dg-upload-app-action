export const sleep: (millis: number) => Promise<boolean> = async millis => {
  return new Promise(resolver => {
    setTimeout(() => {
      resolver(true);
    }, millis);
  });
};
