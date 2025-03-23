import { Jailbird } from "../app";
import { faker } from '@faker-js/faker';

const POSSIBLE_CHARGES = [
  'LARCENY-PETIT-SHOPLIFTING',
  'LARCENY-GRAND-SHOPLIFTING',
  'OTHER OFFENSES-VIOLATE PO-DOMESTIC',
  'SEX OFFENSES-EXPOSING PERSON',
  'OTHER STATE VIOLATIONS-CRIMINAL',
  'OTHER OFFENSES-PROBATION VIOLATION',
  'OTHER OFFENSES-CONTEMPT OF COURT',
  'DRUG VIOL-NON NARC-POSSESS',
  'ASSAULT-NON-AGGRAVATED',
  'OTHER ASSAULTS-OBSTRUCT JUSTICE',
  'POSSESSION OF COCAINE',
  'VIOLATON OF PROTECTIVE ORDER - NON DOMESTIC'
];
const POSSIBLE_JAILS = [
  'HENRICO COUNTY REGIONAL JAIL'
];

/**
 * 
 * @param jailbird - the partial jailbird from which to populate the object
 * @returns a dummy jailbird for testing purposes
 */
const createDummyJailbird = (jailbird?: Partial<Jailbird>): Jailbird => {
  return {
    inmateID: jailbird?.inmateID || faker.string.uuid(),
    name: jailbird?.name || `${faker.person.fullName().toUpperCase()}`,
    charges: jailbird?.charges || `${faker.helpers.arrayElements(POSSIBLE_CHARGES).join(', ')}`,
    picture: jailbird?.picture || faker.internet.url(),
    facility: jailbird?.facility || `${faker.helpers.arrayElement(POSSIBLE_JAILS)}`,
    age: jailbird?.age || faker.number.int({ min: 18, max: 99 }),
    hashtags: jailbird?.hashtags || [
      '#jail',
      '#jailbirds',
      '#mugshots',
    ],
    timestamp: jailbird?.timestamp || faker.date.anytime(),
    isPosted: jailbird?.isPosted || faker.datatype.boolean(),
  }
};

export {
  createDummyJailbird
}