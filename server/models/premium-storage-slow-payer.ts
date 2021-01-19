import { BelongsTo, Column, ForeignKey, Model, Table, DataType } from 'sequelize-typescript'
import { UserModel } from './account/user'

@Table({
  tableName: 'premiumStorageSlowPayer',
  indexes: [
    {
      fields: [ 'id' ],
      unique: true
    },
    {
      fields: [ 'userId' ],
      unique: true
    }
  ]
})

export class premiumStorageSlowPayer extends Model {

  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false, unique: true })
  id!: number

  @ForeignKey(() => UserModel)
  @Column
  userId: number

  @BelongsTo(() => UserModel, {
    foreignKey: {
      allowNull: false
    },
    onDelete: 'cascade'
  })
  User: UserModel

  static async addSlowPayer (userId: number) {
    return await premiumStorageSlowPayer.create({ userId: userId })
  }

  static async deleteSlowPayer (id: number) {
    return await premiumStorageSlowPayer.destroy({ where: { id: id } })
  }

  static async getAllSlowPayers () {
    return await premiumStorageSlowPayer.findAll()
  }
}
