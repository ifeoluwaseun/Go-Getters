import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Task } from "@/context/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Clock, Flame, AlertCircle } from "lucide-react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";

export default function Tasks() {
  const { tasks, completeTask, addEvidence } = useApp();
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'overdue'>('all');

  const todayTasks = tasks.filter(t => t.date === new Date().toISOString().split('T')[0]);
  
  const filteredTasks = todayTasks.filter(t => {
    if (filter === 'all') return true;
    return t.status === filter;
  });

  const overdue = filteredTasks.filter(t => t.status === 'overdue');
  const pending = filteredTasks.filter(t => t.status === 'pending');
  const completed = filteredTasks.filter(t => t.status === 'completed');

  const handleComplete = (id: string) => {
    completeTask(id);
    // Real app would trigger a confetti or toast here
  };

  const TaskCard = ({ task }: { task: Task }) => (
    <Card className={`overflow-hidden transition-all duration-200 ${
      task.status === 'completed' ? 'opacity-70' : ''
    } ${task.status === 'overdue' ? 'border-destructive/50 bg-destructive/5' : ''}`}>
      <CardContent className="p-4 sm:p-6 flex items-start gap-4">
        <button 
          onClick={() => task.status !== 'completed' && handleComplete(task.id)}
          className={`mt-0.5 flex-shrink-0 transition-colors ${
            task.status === 'completed' ? 'text-green-500' : 'text-muted-foreground hover:text-primary'
          }`}
          disabled={task.status === 'completed'}
        >
          {task.status === 'completed' ? <CheckCircle2 size={24} /> : <Circle size={24} />}
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider ${
              task.priority === 'high' ? 'bg-red-500/20 text-red-500' : 
              task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-500' : 
              'bg-gray-500/20 text-gray-500'
            }`}>
              {task.priority}
            </span>
            <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-sm font-medium">
              {task.category}
            </span>
          </div>
          
          <h3 className={`font-bold text-lg mb-1 truncate ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
            {task.title}
          </h3>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span className={task.status === 'overdue' ? 'text-destructive font-bold' : ''}>{task.dueTime}</span>
            </div>
            {task.recurring && (
              <div className="flex items-center gap-1 text-orange-500">
                <Flame size={14} />
                Daily
              </div>
            )}
          </div>
        </div>

        {task.status === 'completed' && !task.hasEvidence && (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="hidden sm:flex">Add Proof</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit Evidence</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p className="text-muted-foreground mb-4">Provide proof for: <strong>{task.title}</strong></p>
                {/* Form would go here, simplified for this layout batch */}
                <Button className="w-full">Upload Screenshot</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Today's Targets</h1>
          <p className="text-muted-foreground">Execute your plan. Protect your streak.</p>
        </div>
        <Button className="font-bold">Add Target</Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')} size="sm">All</Button>
        <Button variant={filter === 'pending' ? 'default' : 'outline'} onClick={() => setFilter('pending')} size="sm">Pending</Button>
        <Button variant={filter === 'overdue' ? 'default' : 'outline'} onClick={() => setFilter('overdue')} size="sm">Overdue</Button>
        <Button variant={filter === 'completed' ? 'default' : 'outline'} onClick={() => setFilter('completed')} size="sm">Completed</Button>
      </div>

      <div className="space-y-8">
        {overdue.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold flex items-center gap-2 text-destructive">
              <AlertCircle size={20} /> Action Required
            </h2>
            {overdue.map(t => <TaskCard key={t.id} task={t} />)}
          </div>
        )}

        {pending.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold">Up Next</h2>
            {pending.map(t => <TaskCard key={t.id} task={t} />)}
          </div>
        )}

        {completed.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-muted-foreground">Done</h2>
            {completed.map(t => <TaskCard key={t.id} task={t} />)}
          </div>
        )}

        {filteredTasks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
            No targets found for this view.
          </div>
        )}
      </div>
    </div>
  );
}
