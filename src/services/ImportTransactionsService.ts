import { In, getCustomRepository, getRepository } from 'typeorm'

import Transaction from '../models/Transaction';
import path from 'path'
import fs from 'fs';
import csvParse from 'csv-parse';

import uploadConfig from '../config/upload'
import CreateTransactionService from './CreateTransactionService';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

interface Request {
  csvfilename: string
}

interface CSVTransaction {
  title: string
  type: 'income' | 'outcome'
  value: number
  category: string
}

class ImportTransactionsService {
  async execute({ csvfilename }: Request): Promise<Transaction[]> {

    const transactionRepository = getCustomRepository(TransactionsRepository)
    const categoryRepository = getRepository(Category)

    console.log(csvfilename)

    const contactsReadStream = fs.createReadStream(csvfilename)

    const parsers = csvParse({
      from_line: 2
    })

    const parseCSV = contactsReadStream.pipe(parsers)
    const transactions: CSVTransaction[] = []
    const categories: string[] = []

    parseCSV.on('data', async line => {

      const [title, type, value, category] = line.map((cell: string) => {
        return cell.trim()
      })

      if (!title || !type || !value) return

      categories.push(category)
      transactions.push({ title, type, value, category })
    })

    await new Promise(resolve => parseCSV.on('end', resolve))

    const existentCategories = await categoryRepository.find({
      where: {
        title: In(categories)
      }
    })

    const existentCategoriestitles = existentCategories.map((category: Category) => category.title)

    const addCategoryTitles = categories.filter(category => !existentCategoriestitles.includes(category)).filter((value, index, self) => self.indexOf(value) === index)

    const newCategories = categoryRepository.create(
      addCategoryTitles.map(title => ({
        title
      }))
    )
    console.log(existentCategories)
    console.log(transactions)

    await categoryRepository.save(newCategories)

    const finalCatecories = [...newCategories, ...existentCategories]

    const createdTransactions = transactionRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCatecories.find(
          category => category.title === transaction.category
        )
      }))
    )

    await transactionRepository.save(createdTransactions)

    await fs.promises.unlink(csvfilename)

    return createdTransactions
  }
}

export default ImportTransactionsService;
