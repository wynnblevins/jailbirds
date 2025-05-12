import { Jailbird } from "../../app";
const { createDummyJailbird } = require('../testUtils/mockDataGenerator');
const { 
  filterSavedJailbirds,
  filterBoringJailbirds
} = require('./jailbirdFilterService')

describe('jailbirdFilterService', () => {
  let dummyJailbird0;
  let dummyJailbird1;
  let dummyJailbird2;
  let dummyJailbird3;
  let dummyJailbird4;
  let dummyJailbird5;
  let dummyJailbird6;
  let dummyJailbird7;
  let dummyJailbird8;
  let dummyJailbird9;  
  let allJailbirds: Jailbird[];
  
  beforeEach(() => {
    allJailbirds = [];
    
    dummyJailbird0 = createDummyJailbird({ 
      charges: 'OTHER OFFENSES-CONTEMPT OF COURT, OTHER OFFENSES-CONTEMPT OF COURT' 
    });
    dummyJailbird1 = createDummyJailbird();
    dummyJailbird2 = createDummyJailbird({ 
      charges: 'OTHER OFFENSES-CONTEMPT OF COURT, OTHER OFFENSES-CONTEMPT OF COURT, OTHER OFFENSES-CONTEMPT OF COURT' 
    });
    dummyJailbird3 = createDummyJailbird();
    dummyJailbird4 = createDummyJailbird({ charges: 'OTHER OFFENSES-CONTEMPT OF COURT' });
    dummyJailbird5 = createDummyJailbird();
    dummyJailbird6 = createDummyJailbird({ 
      charges: 'OTHER OFFENSES-CONTEMPT OF COURT, OTHER OFFENSES-CONTEMPT OF COURT, OTHER OFFENSES-CONTEMPT OF COURT, OTHER OFFENSES-CONTEMPT OF COURT'  
    });
    dummyJailbird7 = createDummyJailbird();
    dummyJailbird8 = createDummyJailbird({ charges: 'OTHER OFFENSES-CONTEMPT OF COURT' });
    dummyJailbird9 = createDummyJailbird();

    allJailbirds.push(dummyJailbird0);
    allJailbirds.push(dummyJailbird1);
    allJailbirds.push(dummyJailbird2);
    allJailbirds.push(dummyJailbird3);
    allJailbirds.push(dummyJailbird5);
    allJailbirds.push(dummyJailbird6);
    allJailbirds.push(dummyJailbird7);
    allJailbirds.push(dummyJailbird8);
    allJailbirds.push(dummyJailbird9);
  });
  
  describe('filterBoringJailbirds', () => {
    it('filters jailbirds with only contempt of court charges', () => {
      const expectedResultLength = 5;
      const CONTEMPT_OF_COURT = 'OTHER OFFENSES-CONTEMPT OF COURT';
      const resultJBs = filterBoringJailbirds(allJailbirds, CONTEMPT_OF_COURT);
      expect(resultJBs.length).toEqual(expectedResultLength);
      resultJBs.forEach((jb: Jailbird) => {
        expect(jb.charges).not.toEqual(CONTEMPT_OF_COURT)
      });
    });
  });
  
  describe('filterSavedJailbirds', () => {
    it('returns expected unsaved jailbirds', () => {
      const dbJailbirds = [
        dummyJailbird0,
        dummyJailbird2,
        dummyJailbird4, 
        dummyJailbird6,
        dummyJailbird8,  
      ];
  
      const resultJbs = filterSavedJailbirds(
        dbJailbirds, 
        allJailbirds
      );
  
      expect(resultJbs).toEqual([
        dummyJailbird1,
        dummyJailbird3,
        dummyJailbird5, 
        dummyJailbird7,
        dummyJailbird9,
      ]);
    });
  });  
});
