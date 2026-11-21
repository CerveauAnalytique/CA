import type { Metadata } from 'next'
import React from 'react'
import { ChatCa7 } from '@/components/Chat/ChatCa7'

export const metadata: Metadata = {
  title: 'Chat with CA7',
  description: 'CA7 is the Cerveau Analytique AI that is very good with data.',
}

export default function ChatCa7Page() {
  return <ChatCa7 />
}
