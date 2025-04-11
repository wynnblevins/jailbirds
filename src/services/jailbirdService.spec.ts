const mockingoose = require('mockingoose');
import { Jailbird } from "../models/Jailbird";  
import { deleteJailbird, findJailbirdByInmateId, findAllJailbirds, findJailbirdById } from './jailbirdService';
import { DUMMY_INMATE_ID_0, createDummyJailbird, createDummyJailbirdWithId } from "../testUtils/mockDataGenerator";
import { jailbirdWithIdField } from "../testUtils/expectations";
import { ObjectId } from "mongoose";

describe("jailbirdService", () => {
  let jailbird0, jailbird1, jailbird2;
  
  beforeEach(() => {
    jailbird0 = createDummyJailbird();
    jailbird1 = createDummyJailbird();
    jailbird2 = createDummyJailbird();  
  });

  describe("findAllJailbirds", () => {
    it("returns a list of jailbirds", async () => {
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

  describe("findJailbirdByInmateId", () => {
    beforeEach(() => {});
    
    it("returns expected jailbird", async () => {
      jest.spyOn(Jailbird, 'findOne').mockReturnValue(jailbird0);
      const resultJb = await findJailbirdByInmateId(jailbird0.inmateID);
      expect(resultJb).toEqual(jailbird0);
    });
  });
});