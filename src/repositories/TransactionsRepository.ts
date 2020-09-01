import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';
import { getRepository } from 'typeorm';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactionsRepository = getRepository(Transaction)
    const transactions = await transactionsRepository.find()

    const balance = transactions.reduce((acc, transaction) => {
      const income = (transaction.type === 'income') ? acc.income + transaction.value : acc.income + 0
      const outcome = (transaction.type === 'outcome') ? acc.outcome + transaction.value : acc.outcome + 0
      return {
        income,
        outcome,
        total: income - outcome
      }
    }, { total: 0, income: 0, outcome: 0 } as Balance)
    return balance
  }
}

export default TransactionsRepository;
