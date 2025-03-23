const { createDummyJailbird } = require('../testUtils/mockDataGenerator');
const { filterSavedJailbirds } = require('./jailbirdFilterService')

describe('filterSavedJailbirds', () => {
  it('returns expected unsaved jailbirds', () => {
    const dummyJailbird0 = createDummyJailbird();
    const dummyJailbird1 = createDummyJailbird();
    const dummyJailbird2 = createDummyJailbird();
    const dummyJailbird3 = createDummyJailbird();
    const dummyJailbird4 = createDummyJailbird();
    const dummyJailbird5 = createDummyJailbird();
    const dummyJailbird6 = createDummyJailbird();
    const dummyJailbird7 = createDummyJailbird();
    const dummyJailbird8 = createDummyJailbird();
    const dummyJailbird9 = createDummyJailbird();
    
    const webpageJailbirds = [
      dummyJailbird0,
      dummyJailbird1,
      dummyJailbird2,
      dummyJailbird3,
      dummyJailbird4,
      dummyJailbird5,
      dummyJailbird6,
      dummyJailbird7,
      dummyJailbird8,
      dummyJailbird9
    ];
    const dbJailbirds = [
      dummyJailbird0,
      dummyJailbird2,
      dummyJailbird4, 
      dummyJailbird6,
      dummyJailbird8,  
    ];

    const resultJbs = filterSavedJailbirds(
        dbJailbirds, 
        webpageJailbirds
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
