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
  quota!: number;

  @Column({ type: DataType.DECIMAL(32), allowNull: false })
  dailyQuota!: number;

  @Column({ type: DataType.DECIMAL(32), allowNull: false })
  duration!: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  active!: number;

  static async getUserPayments (userId: number) {
    const paymentsResponse = await userPremiumStoragePaymentModel.findAll({ where: { userId: userId } })
    return paymentsResponse
  }

  static async getUserActivePayment (userId: number) {
    const paymentsResponse = await userPremiumStoragePaymentModel.findAll({ where: { userId: userId, active: true } })
    return paymentsResponse
  }

  static async getAllActivePayments () {
    const paymentsResponse = await userPremiumStoragePaymentModel.findAll({ where: { active: true } })
    return paymentsResponse
  }

  static async deactivateUserPayment (id: number) {
    const paymentsResponse = await userPremiumStoragePaymentModel.update({ active: false }, { where: { id: id } })
    return paymentsResponse
  }

}
