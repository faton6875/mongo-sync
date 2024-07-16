import * as crypto from 'crypto';
import { getCollections } from './db-connection';
import { CustomerForUpdate } from './customer.dto';
import { Collection } from 'mongodb';

const anonymiseCustomers = (
  customers: CustomerForUpdate[]
): CustomerForUpdate[] => {
  const hashedString = (input: string) => {
    return crypto
      .createHash('sha256')
      .update(input)
      .digest('hex')
      .substring(0, 8);
  };

  return customers.map((customer) => {
    const hashedEmail =
      hashedString(customer.email.split('@')[0]) +
      '@' +
      customer.email.split('@')[1];

    return {
      ...customer,
      firstName: hashedString(customer.firstName),
      lastName: hashedString(customer.lastName),
      email: hashedEmail,
      address: {
        ...customer.address,
        line1: hashedString(customer.address.line1),
        line2: hashedString(customer.address.line2),
        postcode: hashedString(customer.address.postcode),
      },
      createdAt: customer.createdAt,
    };
  });
};
const synchronizeCustomers = async (
  customers: CustomerForUpdate[],
  bulkSize: number,
  anonymisedCustomersCollection: Collection<Document>
) => {
  for (let i = 0; i < customers.length; i += bulkSize) {
    const batch = customers.slice(i, i + bulkSize);
    const bulkOps = batch.map((customer) => ({
      updateOne: {
        filter: { _id: customer._id },
        update: { $set: customer },
        upsert: true,
      },
    }));
    await anonymisedCustomersCollection.bulkWrite(bulkOps);
    console.log(`Записей добавлено:${bulkOps.length}`);
  }
};
const fullSynchronization = async () => {
  const { customersCollection, anonymisedCustomersCollection } =
    await getCollections();
  try {
    const customers = (await customersCollection
      .find()
      .toArray()) as CustomerForUpdate[];

    const anonymisedCustomers = anonymiseCustomers(customers);
    await synchronizeCustomers(
      anonymisedCustomers,
      1000,
      anonymisedCustomersCollection
    );
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
};
async function realTimeSynchronization() {
  const { customersCollection, anonymisedCustomersCollection } =
    await getCollections();
  try {
    setInterval(async () => {
      const customers = (await customersCollection
        .find()
        .toArray()) as CustomerForUpdate[];

      const anonymisedCustomers = anonymiseCustomers(customers);
      await synchronizeCustomers(
        anonymisedCustomers,
        1000,
        anonymisedCustomersCollection
      );
    }, 1000);
  } catch (err) {
    console.error('Ошибка при синхронизации', err);
  }
}

process.argv[2] === '--full-reindex'
  ? fullSynchronization()
  : realTimeSynchronization();
