'use client'

import { Control, FieldArrayWithId } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { 
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { CreateSupplyRequestData } from '@/lib/schemas/supply-request-create'

interface SupplyItemCardProps {
  field: FieldArrayWithId<CreateSupplyRequestData, "items", "id">
  index: number
  control: Control<CreateSupplyRequestData>
  isOpen: boolean
  onToggle: () => void
  onRemove: () => void
  canRemove: boolean
}

export function SupplyItemCard({
  index,
  control,
  isOpen,
  onToggle,
  onRemove,
  canRemove
}: SupplyItemCardProps) {
  const isEven = index % 2 === 0
  
  return (
    <div 
      className={`border rounded-lg transition-colors ${
        isEven 
          ? 'bg-muted/20 hover:bg-muted/30' 
          : 'bg-blue-50/50 hover:bg-blue-50/70 dark:bg-blue-950/20 dark:hover:bg-blue-950/30'
      }`}
    >
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <div className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${
            isEven 
              ? 'hover:bg-muted/40' 
              : 'hover:bg-blue-100/60 dark:hover:bg-blue-900/40'
          }`}>
            <div className="flex items-center gap-2">
              <h4 className="font-medium">Vật tư #{index + 1}</h4>
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
            {canRemove && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove()
                }}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="p-4 pt-0 space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={control}
                name={`items.${index}.name`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên vật tư *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ví dụ: Bút bi xanh" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`items.${index}.quantity`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số lượng *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`items.${index}.unit`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Đơn vị tính *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ví dụ: cái, hộp, kg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`items.${index}.notes`}
                render={({ field }) => (
                  <FormItem className="md:col-span-3">
                    <FormLabel>Ghi chú</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Ghi chú thêm về vật tư này..."
                        className="min-h-[60px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
