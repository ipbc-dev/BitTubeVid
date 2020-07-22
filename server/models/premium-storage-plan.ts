import { Column, DataType, Model, Table } from 'sequelize-typescript'

@Table({
  tableName: 'premiumStoragePlan',
  indexes: [
    {
      fields: [ 'id' ],
      unique: true
    },
    {
      fields: [ 'name' ],
      unique: true
    }
  ]
})
export class PremiumStoragePlanModel extends Model<PremiumStoragePlanModel> {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false, unique: true })
  id!: number;

  @Column({ type: DataType.STRING(50), allowNull: false, unique: true })
  name!: string;

  @Column({ type: DataType.DECIMAL(32), allowNull: false })
  quota!: number;

  @Column({ type: DataType.DECIMAL(32), allowNull: false })
  dailyQuota!: number;

  @Column({ type: DataType.DECIMAL(32, 8), allowNull: false })
  priceTube!: number;

  @Column({ type: DataType.DECIMAL(32), allowNull: false })
  duration!: number;

  @Column({ type: DataType.DECIMAL(32), allowNull: false })
  expiration!: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  active!: boolean;

  static async getPlans () {
    return await PremiumStoragePlanModel.findAll({
      order: [ [ 'quota', "ASC" ], [ 'duration', "ASC" ], [ 'expiration', "ASC" ] ]
    })
  }

  static async addPlan (name: string, quota: number, dailyQuota: number, duration: number, expiration: number, priceTube: number, active: boolean) {
    return await PremiumStoragePlanModel.create(
      { name: name, quota: quota, dailyQuota: dailyQuota, duration: duration, expiration: expiration, priceTube: priceTube, active: active })
  }

  static async updatePlan (id: number, name: string, quota: number, dailyQuota: number, duration: number, expiration: number, priceTube: number, active: boolean) {
    return await PremiumStoragePlanModel.update(
      { name: name, quota: quota, dailyQuota: dailyQuota, duration: duration, expiration: expiration, priceTube: priceTube, active: active },
      { where: { id: id } })
  }

  static async removePlan (id: number) {
    return await PremiumStoragePlanModel.destroy(
      { where: { id: id } })
  }
}
