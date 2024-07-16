import { faker } from '@faker-js/faker';
import { getCollections } from './db-connection';
import 'dotenv/config';
import { CustomerForCreation } from './customer.dto';

const createCustomers = (
  numberCustomersForCreate: number
): CustomerForCreation[] => {
  const customers: CustomerForCreation[] = [];
  const randomCustomersNumber =
    Math.floor(Math.random() * numberCustomersForCreate) + 1;
  for (let i = 0; i < randomCustomersNumber; i++) {
    customers.push({
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      address: {
        line1: faker.location.streetAddress(),
        line2: faker.location.secondaryAddress(),
        postcode: faker.location.zipCode(),
        city: faker.location.city(),
        state: faker.location.state(),
        country: faker.location.country(),
      },
      createdAt: new Date(),
    });
  }
  return customers;
};

const insertCustomers = async () => {
  const { customersCollection } = await getCollections();
  setInterval(async () => {
    try {
      const customers = createCustomers(10);
      await customersCollection.insertMany(customers);
      console.log(`Добавлено покупателей:${customers.length}`);
    } catch (error) {
      console.log(error);
    }
  }, 200);
};

insertCustomers();
