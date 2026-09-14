import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import CustomerListPage from './pages/CustomerListPage'
import CustomerDetailPage from './pages/CustomerDetailPage'
import ContractsPage from './pages/ContractsPage'
import CurrentAccountPage from './pages/CurrentAccountPage'
import CashFlowPage from './pages/CashFlowPage'
import RemindersPage from './pages/RemindersPage'
import ImportBackupPage from './pages/ImportBackupPage'
import OperationLogPage from './pages/OperationLogPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/customers" element={<CustomerListPage />} />
        <Route path="/customers/:id" element={<CustomerDetailPage />} />
        <Route path="/contracts" element={<ContractsPage />} />
        <Route path="/current-account" element={<CurrentAccountPage />} />
        <Route path="/cash-flow" element={<CashFlowPage />} />
        <Route path="/reminders" element={<RemindersPage />} />
        <Route path="/import" element={<ImportBackupPage />} />
        <Route path="/logs" element={<OperationLogPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
