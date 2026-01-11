import { Jailbird } from "../app";

const jailbirdWithIdField = (jb: Jailbird) => {
  return { ...jb, _id: expect.anything() };
};

export { 
  jailbirdWithIdField,
}