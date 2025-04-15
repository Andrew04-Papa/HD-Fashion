"use client"

import { useState } from "react"
import { MessageSquare, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Chatbot from "@/components/chatbot"

export default function ChatbotButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button className="fixed bottom-4 right-4 rounded-full h-14 w-14 shadow-lg" onClick={() => setIsOpen(true)}>
        <MessageSquare className="h-6 w-6" />
        <span className="sr-only">Open AI Shopping Assistant</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative bg-background rounded-lg shadow-lg w-full max-w-md h-[600px] max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="text-lg font-medium">AI Shopping Assistant</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
            <Chatbot />
          </div>
        </div>
      )}
    </>
  )
}

