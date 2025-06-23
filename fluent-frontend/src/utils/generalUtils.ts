export const groupById = <T extends { _id: string }>(ObjectArr: T[]): { [key: string]: T } => {
  return ObjectArr.reduce((acc, value) => {
    return { ...acc, [value._id]: value };
  }, {});
};
