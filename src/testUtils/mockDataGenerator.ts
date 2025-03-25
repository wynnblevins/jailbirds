import { Jailbird } from "../app";
import { faker } from '@faker-js/faker';
import { JAILS, MIDLOTHIAN_CHARGES, RICHMOND_CHARGES } from "../utils/strings";

const POSSIBLE_MIDLOTHIAN_CHARGES = [
  MIDLOTHIAN_CHARGES.LARCENY_PETIT_SHOPLIFTING,
  MIDLOTHIAN_CHARGES.LARCENY_GRAND_SHOPLIFTING,
  MIDLOTHIAN_CHARGES.OTHER_OFFENSES_VIOLATE_PO_DOMESTIC,
  MIDLOTHIAN_CHARGES.SEX_OFFENSES_EXPOSING_PERSON,
  MIDLOTHIAN_CHARGES.OTHER_STATE_VIOLATIONS_CRIMINAL,
  MIDLOTHIAN_CHARGES.OTHER_OFFENSES_PROBATION_VIOLATION,
  MIDLOTHIAN_CHARGES.OTHER_OFFENSES_CONTEMPT_OF_COURT,
  MIDLOTHIAN_CHARGES.DRUG_VIOL_NON_NARC_POSSESS,
  MIDLOTHIAN_CHARGES.ASSAULT_NON_AGGRAVATED,
  MIDLOTHIAN_CHARGES.OTHER_ASSAULTS_OBSTRUCT_JUSTICE,
  MIDLOTHIAN_CHARGES.POSSESSION_OF_COCAINE,
  MIDLOTHIAN_CHARGES.VIOLATON_OF_PROTECTIVE_ORDER_NON_DOMESTIC
];

const POSSIBLE_RICHMOND_CHARGES = [
  RICHMOND_CHARGES.OBSTRUCTION_OF_JUSTICE, 
  RICHMOND_CHARGES.WEAPONS_CARRY_CONCEALED_WEAPON_OTHER_THAN_FIREARM, 
  RICHMOND_CHARGES.WEAPONS_BRANDISH_MACHETE_OR_BLADED_WEAPON, 
  RICHMOND_CHARGES.ASSAULT_SIMPLE_ASSAULT_ON_LAW_ENFORCEMENT, 
  RICHMOND_CHARGES.ASSAULT_SIMPLE_ASSAULT_AGAINST_FAMILY_MEMBER
]

const POSSIBLE_JAILS = [
  JAILS.HENRICO_COUNTY_REGIONAL_JAIL,
  JAILS.RICHMOND_CITY_JAIL
];

/**
 * 
 * @param jailbird - the partial jailbird from which to populate the object
 * @returns a dummy jailbird for testing purposes
 */
const createDummyJailbird = (jailbird?: Partial<Jailbird>): Jailbird => {
  // depending on which jail we're in, build the appropriate charges string 
  let charges: string = '';
  const jail = faker.helpers.arrayElement(POSSIBLE_JAILS);
  if (jail === JAILS.HENRICO_COUNTY_REGIONAL_JAIL) {
    charges = faker.helpers.arrayElements(POSSIBLE_MIDLOTHIAN_CHARGES).join(', ')
  } else if (jail === JAILS.RICHMOND_CITY_JAIL) {
    charges = faker.helpers.arrayElements(POSSIBLE_RICHMOND_CHARGES).join(', ')
  }
  
  // construct the dummy jailbird
  return {
    inmateID: jailbird?.inmateID || faker.string.uuid(),
    name: jailbird?.name || `${faker.person.fullName().toUpperCase()}`,
    charges: jailbird?.charges || `${charges}`,
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