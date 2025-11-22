import { createFileRoute } from '@tanstack/react-router'
import { DownloadPage } from '../components/DownloadPage'

export const Route = createFileRoute('/files/$uuid')({
  component: DownloadPage,
})
