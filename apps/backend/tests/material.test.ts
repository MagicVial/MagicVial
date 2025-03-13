import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import MaterialModel from '../src/models/Material';

// Setup in-memory database
let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clean up collections
  await MaterialModel.deleteMany({});
});

describe('Material Model Tests', () => {
  it('should successfully create a material', async () => {
    const materialData = {
      name: 'Test Material',
      description: 'This is a test material',
      type: 'Basic',
      rarity: 'Common',
      image: 'https://example.com/image.png',
      attributes: [
        { trait_type: 'Element', value: 'Fire' },
        { trait_type: 'Power', value: '10' }
      ],
      seasonId: null,
      discoveryRate: 0.05,
      maxSupply: 1000
    };

    const material = await MaterialModel.create(materialData);
    expect(material).toBeDefined();
    expect(material.name).toBe('Test Material');
    expect(material.type).toBe('Basic');
    expect(material.rarity).toBe('Common');
    expect(material.attributes.length).toBe(2);
  });

  it('should validate required fields', async () => {
    const invalidMaterial = new MaterialModel({
      // Missing required fields
    });

    await expect(invalidMaterial.validate()).rejects.toThrow();
  });

  it('should validate type enum', async () => {
    const invalidMaterial = new MaterialModel({
      name: 'Test Material',
      description: 'This is a test material',
      type: 'Invalid Type', // Invalid type
      rarity: 'Common'
    });

    await expect(invalidMaterial.validate()).rejects.toThrow();
  });

  it('should validate rarity enum', async () => {
    const invalidMaterial = new MaterialModel({
      name: 'Test Material',
      description: 'This is a test material',
      type: 'Basic',
      rarity: 'Invalid Rarity' // Invalid rarity
    });

    await expect(invalidMaterial.validate()).rejects.toThrow();
  });
}); 