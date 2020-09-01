import AppError from '../errors/AppError';
import { getRepository, getCustomRepository } from 'typeorm';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionRepository from '../repositories/TransactionsRepository'

interface Request {
  title: string
  value: number
  type: 'income' | 'outcome'
  category: string
}

class CreateTransactionService {
  public async execute({ title, type, value, category }: Request): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionRepository)
    const categoryRepository = getRepository(Category)

    if (type === 'outcome') {
      const balance = await transactionRepository.getBalance()
      if (value > balance.total) {
        throw new AppError('Outcome extrapolou Income', 400)
      }
    }

    let idCategory
    const categoryExist = await categoryRepository.findOne({
      title: category
    })

    if (categoryExist) {
      idCategory = categoryExist.id
    } else {
      const newCategory = categoryRepository.create({ title: category })
      await categoryRepository.save(newCategory)
      idCategory = newCategory.id
    }

    const transaction = transactionRepository.create({
      title,
      type,
      value,
      category_id: idCategory
    })

    await transactionRepository.save(transaction)

    return transaction
  }
}

export default CreateTransactionService;
