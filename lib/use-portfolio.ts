'use client'

import { useState, useEffect } from 'react'
import { PortfolioData, defaultPortfolioData, loadPortfolioData } from './portfolio-data'

export function usePortfolioData(): PortfolioData {
  const [data, setData] = useState<PortfolioData>(defaultPortfolioData)

  useEffect(() => {
    setData(loadPortfolioData())

    const handleStorage = () => {
      setData(loadPortfolioData())
    }
    window.addEventListener('storage', handleStorage)

    const interval = setInterval(() => {
      setData(loadPortfolioData())
    }, 1000)

    return () => {
      window.removeEventListener('storage', handleStorage)
      clearInterval(interval)
    }
  }, [])

  return data
}
