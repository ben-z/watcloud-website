import { machineInfo } from '@/lib/data'
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

function formatLimit(limit: number | string) {
    if (limit === 0 || limit === '0') {
        return 'unlimited'
    }
    return limit
}

export default function QuotaTable({
    className = "",
}: {
    className?: string
}) {
    const rows = []
    for (const machine of machineInfo.dev_vms) {
        for (const mount of (machine.mounts_with_quotas || [])) {
            rows.push(
                <TableRow>
                    <TableCell>{machine.name}</TableCell>
                    <TableCell>{mount.name}</TableCell>
                    <TableCell>{mount.mountpoint}</TableCell>
                    <TableCell className='text-center'>{formatLimit(mount.user_quota.default.bytes_soft_limit)}</TableCell>
                    <TableCell className='text-center'>{formatLimit(mount.user_quota.default.bytes_hard_limit)}</TableCell>
                    <TableCell className='text-center'>{formatLimit(mount.user_quota.default.inodes_soft_limit)}</TableCell>
                    <TableCell className='text-center'>{formatLimit(mount.user_quota.default.inodes_hard_limit)}</TableCell>
                </TableRow>
            )
        }
    }

    return (
        <Table className={className}>
            <TableHeader>
                <TableRow>
                    <TableHead>Machine</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Mount Point</TableHead>
                    <TableHead colSpan={2} className='text-center'>Size Limit (bytes)</TableHead>
                    <TableHead colSpan={2} className='text-center'>Inode Limit</TableHead>
                </TableRow>
                <TableRow>
                    <TableHead></TableHead>
                    <TableHead></TableHead>
                    <TableHead></TableHead>
                    <TableHead className='text-center'>Soft</TableHead>
                    <TableHead className='text-center'>Hard</TableHead>
                    <TableHead className='text-center'>Soft</TableHead>
                    <TableHead className='text-center'>Hard</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>{rows}</TableBody>
        </Table>
    )
}