import { shuffle } from '../services/shuffleService'

const boyNames: string[] = [
  'James',
  'Michael',
  'Robert',
  'John',
  'David',
  'William',
  'Richard',
  'Joseph',
  'Thomas',
  'Christopher',
  'Charles',
  'Daniel',
  'Matthew',
  'Anthony',
  'Mark',
  'Donald',
  'Steven',
  'Andrew',
  'Paul',
  'Joshua',
  'Kenneth',
  'Kevin',
  'Brian',
  'Timothy',
  'Ronald',
  'George',
  'Jason',
  'Edward',
  'Jeffrey',
  'Ryan',
  'Jacob',
  'Nicholas',
  'Gary',
  'Eric',
  'Jonathan',
  'Stephen',
  'Larry',
  'Justin',
  'Scott',
  'Brandon',
  'Benjamin',
  'Samuel',
  'Gregory',
  'Alexander',
  'Patrick',
  'Frank',
  'Raymond',
  'Jack',
  'Dennis',
  'Jerry',
  'Tyler',
  'Aaron',
  'Jose',
  'Adam',
  'Nathan',
  'Henry',
  'Zachary',
  'Douglas',
  'Peter',
  'Kyle',
  'Noah',
  'Ethan',
  'Jeremy',
  'Christian',
  'Walter',
  'Keith',
  'Austin',
  'Roger',
  'Terry',
  'Sean',
  'Gerald',
  'Carl',
  'Dylan',
  'Harold',
  'Jordan',
  'Jesse',
  'Bryan',
  'Lawrence',
  'Arthur',
  'Gabriel',
  'Bruce',
  'Logan',
  'Billy',
  'Joe',
  'Alan',
  'Juan',
  'Elijah',
  'Willie',
  'Albert',
  'Wayne',
  'Randy',
  'Mason',
  'Vincent',
  'Liam',
  'Roy',
  'Bobby',
  'Caleb',
  'Bradley',
  'Russell',
  'Lucas',
];

const girlNames = [
  "Mary",
  "Patricia",
  "Jennifer",
  "Linda",
  "Elizabeth",
  "Barbara",
  "Susan",
  "Jessica",
  "Karen",
  "Sarah",
  "Lisa",
  "Nancy",
  "Sandra",
  "Betty",
  "Ashley",
  "Emily",
  "Kimberly",
  "Margaret",
  "Donna",
  "Michelle",
  "Carol",
  "Amanda",
  "Melissa",
  "Deborah",
  "Stephanie",
  "Rebecca",
  "Sharon",
  "Laura",
  "Cynthia",
  "Dorothy",
  "Amy",
  "Kathleen",
  "Angela",
  "Shirley",
  "Emma",
  "Brenda",
  "Pamela",
  "Nicole",
  "Anna",
  "Samantha",
  "Katherine",
  "Christine",
  "Debra",
  "Rachel",
  "Carolyn",
  "Janet",
  "Maria",
  "Olivia",
  "Heather",
  "Helen",
  "Catherine",
  "Diane",
  "Julie",
  "Victoria",
  "Joyce",
  "Lauren",
  "Kelly",
  "Christina",
  "Ruth",
  "Joan",
  "Virginia",
  "Judith",
  "Evelyn",
  "Hannah",
  "Andrea",
  "Megan",
  "Cheryl",
  "Jacqueline",
  "Madison",
  "Teresa",
  "Abigail",
  "Sophia",
  "Martha",
  "Sara",
  "Gloria",
  "Janice",
  "Kathryn",
  "Ann",
  "Isabella",
  "Judy",
  "Charlotte",
  "Julia",
  "Grace",
  "Amber",
  "Alice",
  "Jean",
  "Denise",
  "Frances",
  "Danielle",
  "Marilyn",
  "Natalie",
  "Beverly",
  "Diana",
  "Brittany",
  "Theresa",
  "Kayla",
  "Alexis",
  "Doris",
  "Lori",
  "Tiffany"
];

const getSearchNames = () => {
  let names = [...boyNames, ...girlNames];
  return shuffle(names);
};

export {
  getSearchNames
}