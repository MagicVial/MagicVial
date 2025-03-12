import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Material from '../src/models/Material.model';

// 设置内存数据库
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
  // 清理集合
  await Material.deleteMany({});
});

describe('Material 模型测试', () => {
  it('应该成功创建材料', async () => {
    const materialData = {
      name: '测试材料',
      description: '这是一个测试材料',
      type: '基础',
      rarity: '普通',
      imageUrl: '/test.png',
      maxQuantity: 100,
      isEnabled: true
    };
    
    const material = await Material.create(materialData);
    
    expect(material).toBeDefined();
    expect(material.name).toBe(materialData.name);
    expect(material.description).toBe(materialData.description);
    expect(material.type).toBe(materialData.type);
    expect(material.rarity).toBe(materialData.rarity);
    expect(material.imageUrl).toBe(materialData.imageUrl);
    expect(material.maxQuantity).toBe(materialData.maxQuantity);
    expect(material.isEnabled).toBe(materialData.isEnabled);
    expect(material.createdAt).toBeDefined();
    expect(material.updatedAt).toBeDefined();
  });
  
  it('应该验证必填字段', async () => {
    expect.assertions(1);
    
    try {
      await Material.create({
        // 缺少必填字段
      });
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
  
  it('应该验证类型枚举', async () => {
    expect.assertions(1);
    
    try {
      await Material.create({
        name: '测试材料',
        description: '这是一个测试材料',
        type: '无效类型', // 无效的类型
        rarity: '普通'
      });
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
  
  it('应该验证稀有度枚举', async () => {
    expect.assertions(1);
    
    try {
      await Material.create({
        name: '测试材料',
        description: '这是一个测试材料',
        type: '基础',
        rarity: '无效稀有度' // 无效的稀有度
      });
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
  
  it('应该防止重复的材料名称', async () => {
    expect.assertions(1);
    
    // 先创建一个材料
    await Material.create({
      name: '测试材料',
      description: '这是一个测试材料',
      type: '基础',
      rarity: '普通'
    });
    
    // 尝试创建同名材料
    try {
      await Material.create({
        name: '测试材料', // 重复的名称
        description: '这是另一个测试材料',
        type: '基础',
        rarity: '普通'
      });
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
  
  it('应该可以按类型查找材料', async () => {
    // 创建两种类型的材料
    await Material.create({
      name: '基础材料1',
      description: '这是一个基础材料',
      type: '基础',
      rarity: '普通'
    });
    
    await Material.create({
      name: '基础材料2',
      description: '这是另一个基础材料',
      type: '基础',
      rarity: '普通'
    });
    
    await Material.create({
      name: '稀有材料',
      description: '这是一个稀有材料',
      type: '稀有',
      rarity: '稀有'
    });
    
    // 查找基础类型的材料
    const materials = await Material.findByType('基础');
    
    expect(materials).toBeDefined();
    expect(materials.length).toBe(2);
    expect(materials[0].type).toBe('基础');
    expect(materials[1].type).toBe('基础');
  });
  
  it('应该可以按稀有度查找材料', async () => {
    // 创建两种稀有度的材料
    await Material.create({
      name: '普通材料1',
      description: '这是一个普通材料',
      type: '基础',
      rarity: '普通'
    });
    
    await Material.create({
      name: '普通材料2',
      description: '这是另一个普通材料',
      type: '基础',
      rarity: '普通'
    });
    
    await Material.create({
      name: '稀有材料',
      description: '这是一个稀有材料',
      type: '稀有',
      rarity: '稀有'
    });
    
    // 查找普通稀有度的材料
    const materials = await Material.findByRarity('普通');
    
    expect(materials).toBeDefined();
    expect(materials.length).toBe(2);
    expect(materials[0].rarity).toBe('普通');
    expect(materials[1].rarity).toBe('普通');
  });
}); 