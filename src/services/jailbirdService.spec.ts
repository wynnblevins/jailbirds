const mockingoose = require('mockingoose');
import { Jailbird } from "../models/Jailbird";  
import { deleteJailbird, findAllJailbirds } from './jailbirdService';
import { DUMMY_INMATE_ID_0, createDummyJailbird } from "../testUtils/mockDataGenerator";
import { jailbirdWithIdField } from "../testUtils/expectations";

describe("jailbirdService", () => {
  let jailbird;
  
  beforeEach(() => {
    
  });

  describe("findAllJailbirds", () => {
    it("returns a list of jailbirds", async () => {
      const jailbird0 = createDummyJailbird();
      const jailbird1 = createDummyJailbird();
      const jailbird2 = createDummyJailbird();
      
      mockingoose(Jailbird).toReturn([
        jailbird0,
        jailbird1,
        jailbird2
      ]);

      const resultJailbirds = await findAllJailbirds();

      expect(resultJailbirds).toEqual([
        jailbirdWithIdField(jailbird0),
        jailbirdWithIdField(jailbird1),
        jailbirdWithIdField(jailbird2)
      ]);
    });
  });
});