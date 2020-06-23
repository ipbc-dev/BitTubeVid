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
}
