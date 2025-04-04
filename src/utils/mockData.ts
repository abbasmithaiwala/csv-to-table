import { TableData } from '../types';

interface Person extends TableData {
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  city: string;
  state: string;
}

const firstNames = ['John', 'Jane', 'Mike', 'Sara', 'Robert', 'Emily', 'David', 'Sophia', 'James', 'Olivia'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'];
const states = ['NY', 'CA', 'IL', 'TX', 'AZ', 'PA', 'TX', 'CA', 'TX', 'CA'];

/**
 * Creates mock person data for testing the table
 * @param count Number of records to generate
 * @returns Array of person objects
 */
export const createMockPersonData = (count: number = 50): Person[] => {
  return Array.from({ length: count }).map((_, index) => {
    const firstNameIndex = Math.floor(Math.random() * firstNames.length);
    const lastNameIndex = Math.floor(Math.random() * lastNames.length);
    const cityIndex = Math.floor(Math.random() * cities.length);
    
    return {
      id: index + 1,
      firstName: firstNames[firstNameIndex],
      lastName: lastNames[lastNameIndex],
      email: `${firstNames[firstNameIndex].toLowerCase()}.${lastNames[lastNameIndex].toLowerCase()}@example.com`,
      age: Math.floor(Math.random() * 40) + 20, // age between 20 and 60
      city: cities[cityIndex],
      state: states[cityIndex],
    };
  });
}; 