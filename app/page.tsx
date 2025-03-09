'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, StopCircle } from 'lucide-react';
import Markdown from 'react-markdown';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export default function Home() {
  const { toast } = useToast();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! How can I help you today?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [botResponse, setResponse] = useState('');
  const [streaming, setStreaming] = useState(false);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Simulate bot response
    setResponse(''); // Reset response

    try {
      const EXT = `${process.env.NEXT_PUBLIC_OLLAMA_URL}/chat`;

      const INT = 'http://localhost:11434/api/generate';

      const API = '/api/chat';

      const controller = new AbortController();

      controllerRef.current = controller;

      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.2',
          prompt: inputMessage,
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!res.body) {
        toast({
          title: 'Error',
          content: 'No response body',
        });
      }

      setInputMessage('');

      setStreaming(true);

      if (!res.body) {
        toast({
          title: 'Error',
          content: 'No response body',
        });
        return;
      }
      const reader = res.body.getReader();

      const decoder = new TextDecoder();

      let tempContent = '';

      while (true) {
        const { value, done } = await reader.read();

        if (done) break;

        try {
          const json = JSON.parse(decoder.decode(value));

          if (json?.response) {
            setResponse((prev) => prev + json.response);

            tempContent += json.response;
          } else if (json?.error) {
            toast({
              title: json?.message || 'Something went wrong',
            });
          }
        } catch (error) {
          console.log(error);

          // toast({
          //   title: (error as any)?.message || 'error streaming',
          // });
        }
      }

      const botMessage: Message = {
        id: Date.now().toString(),
        content: tempContent,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      setStreaming(false);
    } catch (error) {
      toast({
        title: (error as any)?.message || 'Unexpected error',
      });
    }
  };

  const controllerRef = useRef<AbortController | null>(null);

  const stopStreaming = () => {
    if (controllerRef.current) {
      controllerRef.current.abort(); // Cancel request
      controllerRef.current = null;
    }
    setStreaming(false);
  };

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto p-4">
      <div className="flex items-center space-x-4 p-4 border-b">
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" />
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">Chat Assistant</h1>
          <p className="text-sm text-muted-foreground">Always here to help</p>
        </div>
      </div>

      <Toaster />

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`flex items-start space-x-2 max-w-[80%] ${
                  message.sender === 'user'
                    ? 'flex-row-reverse space-x-reverse'
                    : ''
                }`}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={
                      message.sender === 'user'
                        ? 'https://github.com/shadcn.png'
                        : 'https://avatars.githubusercontent.com/u/124599?v=4'
                    }
                  />
                  <AvatarFallback>
                    {message.sender === 'user' ? 'U' : 'B'}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`rounded-lg p-3 ${
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <Markdown>{message.content}</Markdown>
                  <span className="text-xs opacity-50">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {streaming && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-2 max-w-[80%]">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://avatars.githubusercontent.com/u/124599?v=4" />
                  <AvatarFallback>B</AvatarFallback>
                </Avatar>
                <div className="rounded-lg p-3 bg-muted">
                  <Markdown>{botResponse}</Markdown>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex space-x-2"
        >
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
          />
          <Button type="submit" size="icon">
            {streaming ? (
              <StopCircle className="h-4 w-4" onClick={stopStreaming} />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
