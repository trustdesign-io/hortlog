import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

const meta: Meta<typeof Table> = {
  title: 'UI/Table',
  component: Table,
}

export default meta

type Story = StoryObj<typeof Table>

const teamMembers = [
  { name: 'Alice Nguyen', email: 'alice@acme.io', role: 'Admin', status: 'Active', joined: '12 Jan 2024' },
  { name: 'Ben Carter', email: 'ben@acme.io', role: 'Editor', status: 'Active', joined: '3 Mar 2024' },
  { name: 'Clara Smith', email: 'clara@acme.io', role: 'Viewer', status: 'Inactive', joined: '27 Apr 2024' },
  { name: 'David Park', email: 'david@acme.io', role: 'Editor', status: 'Active', joined: '15 Jun 2024' },
  { name: 'Evelyn Torres', email: 'evelyn@acme.io', role: 'Admin', status: 'Active', joined: '2 Sep 2024' },
]

export const TeamMembers: Story = {
  render: () => (
    <Table>
      <TableCaption>A list of current team members and their roles.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Joined</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {teamMembers.map((member) => (
          <TableRow key={member.email}>
            <TableCell className="font-medium">{member.name}</TableCell>
            <TableCell className="text-muted-foreground">{member.email}</TableCell>
            <TableCell>{member.role}</TableCell>
            <TableCell>
              <Badge variant={member.status === 'Active' ? 'default' : 'secondary'}>
                {member.status}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">{member.joined}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
}

const invoices = [
  { id: 'INV-001', client: 'Acme Corp', amount: '$2,400.00', status: 'Paid', due: '1 Oct 2024' },
  { id: 'INV-002', client: 'Globex Ltd', amount: '$1,150.00', status: 'Pending', due: '15 Oct 2024' },
  { id: 'INV-003', client: 'Initech', amount: '$3,800.00', status: 'Paid', due: '22 Oct 2024' },
  { id: 'INV-004', client: 'Umbrella Inc', amount: '$950.00', status: 'Overdue', due: '5 Nov 2024' },
  { id: 'INV-005', client: 'Soylent Corp', amount: '$5,200.00', status: 'Pending', due: '18 Nov 2024' },
]

const statusVariant = (status: string) => {
  if (status === 'Paid') return 'default'
  if (status === 'Overdue') return 'destructive'
  return 'secondary'
}

export const Invoices: Story = {
  render: () => (
    <Table>
      <TableCaption>Outstanding and recent invoices.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Due date</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((inv) => (
          <TableRow key={inv.id}>
            <TableCell className="font-medium">{inv.id}</TableCell>
            <TableCell>{inv.client}</TableCell>
            <TableCell>
              <Badge variant={statusVariant(inv.status)}>{inv.status}</Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">{inv.due}</TableCell>
            <TableCell className="text-right font-mono">{inv.amount}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={4}>Total outstanding</TableCell>
          <TableCell className="text-right font-mono">$14,500.00</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
}
