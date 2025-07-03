'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { brainstormIdeas, type BrainstormIdeasOutput } from '@/ai/flows/brainstorm-ideas';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Wand2 } from 'lucide-react';

const formSchema = z.object({
  topic: z.string().min(3, {
    message: 'Topic must be at least 3 characters long.',
  }),
});

export function BrainstormForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BrainstormIdeasOutput | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    setResult(null);
    try {
      const response = await brainstormIdeas(values);
      setResult(response);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'An error occurred.',
        description: 'Failed to brainstorm ideas. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="topic"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-lg font-semibold font-headline">Enter a Topic</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 'sustainable packaging'" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={loading} className="w-full bg-accent text-accent-foreground hover:bg-accent/90 focus-visible:ring-accent">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            Generate Ideas
          </Button>
        </form>
      </Form>
      {loading && (
        <div className="text-center p-4">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground mt-2">Our AI is thinking...</p>
        </div>
      )}
      {result && (
        <div>
          <h4 className="text-xl font-bold font-headline mb-4">Creative Ideas:</h4>
          <Card className="max-h-60 overflow-y-auto bg-background/50">
            <CardContent className="p-4">
              <ul className="list-disc list-inside space-y-2 text-foreground">
                {result.ideas.map((idea, index) => (
                  <li key={index}>{idea}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
