import { Column, DataType, Model, Table } from 'sequelize-typescript'

@Table({
  tableName: 'userPremiumStoragePayment',
  indexes: [
    {
      fields: [ 'id' ],
      unique: true
    }
  ]
})

export class userPremiumStoragePaymentModel extends Model<userPremiumStoragePaymentModel> {

  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false, unique: true })
  id!: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  userId!: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  planId!: number;

  @Column({ type: DataType.DATE, allowNull: false })
  dateFrom!: number;

  @Column({ type: DataType.DATE, allowNull: false })
  dateTo!: number;

  @Column({ type: DataType.DECIMAL(32, 8), allowNull: false })
  priceTube!: number;

  @Column({ type: DataType.DECIMAL(32), allowNull: false })
  duration!: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  active!: number;

}
