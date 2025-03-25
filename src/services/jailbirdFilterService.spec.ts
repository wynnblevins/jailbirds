const { createDummyJailbird } = require('../testUtils/mockDataGenerator');
const { filterSavedJailbirds } = require('./jailbirdFilterService')

describe('filterSavedJailbirds', () => {
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
  const allJailbirds = [];
  
  beforeEach(() => {
    dummyJailbird0 = createDummyJailbird();
    dummyJailbird1 = createDummyJailbird();
    dummyJailbird2 = createDummyJailbird();
    dummyJailbird3 = createDummyJailbird();
    dummyJailbird4 = createDummyJailbird();
    dummyJailbird5 = createDummyJailbird();
    dummyJailbird6 = createDummyJailbird();
    dummyJailbird7 = createDummyJailbird();
    dummyJailbird8 = createDummyJailbird();
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
  })
  
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
