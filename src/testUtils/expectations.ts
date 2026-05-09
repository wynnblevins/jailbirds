import { IJailbird } from "../app";

const jailbirdWithIdField = (jb: IJailbird) => {
  return { ...jb, _id: expect.anything() };
};

export { 
  jailbirdWithIdField,
}