import { Collection, MongoClient } from 'mongodb';
import 'dotenv/config';
async function connectToMongo() {
  try {
    const dbUri = process.env.DB_URI as string;
    let mongoClient = new MongoClient(dbUri);
    return await mongoClient.connect();
  } catch (error) {
    console.log(error);
    process.exit();
  }
}

export const getCollections = async () => {
  const mongoClient = await connectToMongo();
  const db = mongoClient.db();
  const customersCollection = db.collection('customers');
  const anonymisedCustomersCollection = db.collection(
    'customers_anonymised'
  ) as Collection<Document>;
  return { customersCollection, anonymisedCustomersCollection };
};
