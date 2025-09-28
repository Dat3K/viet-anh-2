"use client"

import { useMemo, useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { StatusBadge } from "@/components/ui/status-badge"
import { PriorityBadge } from "@/components/ui/priority-badge"
import { Loader2, Check, X, RefreshCw, AlertCircle, Pencil, ChevronDown } from "lucide-react"
import { format } from "date-fns"
import { vi } from "date-fns/locale"
import { toast } from "sonner"
import type { SupplyRequestWithItems } from "@/types/database"
import { usePendingApprovalRequests, useProcessApproval, useUpdateSupplyRequestItem, useSupplyRequestRealtime } from "@/hooks/use-supply-requests"

export default function ApproveSupplyRequestsPage() {

  const { data: pending = [], isLoading, isRefetching, error, refetch } = usePendingApprovalRequests()
  const processApproval = useProcessApproval()
  const updateItem = useUpdateSupplyRequestItem()
  
  // 🚀 OPTIMIZED REALTIME - Tự động cập nhật khi có thay đổi từ database
  const realtimeStatus = useSupplyRequestRealtime({
    enableOptimizations: true,
    debounceMs: 150, // Tối ưu cho trang approval
    enableHealthMonitoring: true
  })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogAction, setDialogAction] = useState<"approve" | "reject">("approve")
  const [selectedRequest, setSelectedRequest] = useState<SupplyRequestWithItems | null>(null)
  const [comments, setComments] = useState("")
  // Local edited items state: requestId -> itemId -> partial updates
  const [editedItems, setEditedItems] = useState<Record<string, Record<string, Partial<{ name: string; quantity: number; unit: string; notes?: string }>>>>({})

  const totalItems = useMemo(() => pending.reduce((acc, r) => acc + (r.items?.length || 0), 0), [pending])

  const openDialog = (request: SupplyRequestWithItems, action: "approve" | "reject") => {
    setSelectedRequest(request)
    setDialogAction(action)
    setComments("")
    setDialogOpen(true)
  }

  const handleConfirm = async () => {
    if (!selectedRequest) return
    try {
      // Persist edited items for this request first (save final state only)
      const requestEdits = editedItems[selectedRequest.id]
      if (requestEdits && Object.keys(requestEdits).length > 0) {
        const tasks = Object.entries(requestEdits).map(([itemId, updates]) =>
          updateItem.mutateAsync({ requestId: selectedRequest.id, itemId, updates })
        )
        await Promise.allSettled(tasks)
      }

      await processApproval.mutateAsync({
        requestId: selectedRequest.id,
        action: dialogAction,
        comments: comments.trim() || undefined,
      })
      setDialogOpen(false)
      setSelectedRequest(null)
      setComments("")
      // Clear local edits for this request after successful processing
      setEditedItems((prev) => {
        const next = { ...prev }
        delete next[selectedRequest.id]
        return next
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Không thể xử lý phê duyệt"
      toast.error(message)
    }
  }

  if (error) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <div className="text-center">
            <h2 className="text-lg font-semibold">Có lỗi xảy ra</h2>
            <p className="text-muted-foreground">{error.message}</p>
          </div>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Thử lại
          </Button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Phê duyệt yêu cầu</h1>
            <p className="text-muted-foreground">
              Danh sách yêu cầu đang chờ bạn phê duyệt
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{pending.length} yêu cầu</Badge>
            <Badge variant="outline">{totalItems} vật tư</Badge>
            
            {/* 🚀 REALTIME CONNECTION STATUS */}
            <Badge 
              variant={realtimeStatus.isHealthy ? "default" : "secondary"}
              className={`transition-colors ${realtimeStatus.isHealthy ? 'bg-green-500 hover:bg-green-600' : 'bg-yellow-500 hover:bg-yellow-600'}`}
            >
              {realtimeStatus.isConnected ? (
                <span className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${realtimeStatus.isHealthy ? 'bg-green-200 animate-pulse' : 'bg-yellow-200'}`} />
                  {realtimeStatus.isHealthy ? 'Realtime' : 'Lỗi kết nối'}
                </span>
              ) : (
                'Offline'
              )}
            </Badge>
            
            <Button 
              onClick={() => {
                refetch()
                realtimeStatus.refreshHealth()
              }} 
              variant="outline" 
              disabled={isRefetching || isLoading}
            >
              {isRefetching || isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Làm mới
            </Button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <Card>
            <CardHeader>
              <CardTitle>Danh sách phê duyệt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Đang tải...</span>
              </div>
            </CardContent>
          </Card>
        ) : pending.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Danh sách phê duyệt (0)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                Hiện không có yêu cầu nào cần bạn phê duyệt.
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Danh sách phê duyệt ({pending.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pending.map((request) => (
                <div key={request.id} className="rounded-md border">
                  <Collapsible>
                    <div className="grid gap-4 p-4 lg:grid-cols-[2fr_auto_auto] md:grid-cols-1 items-start">
                      {/* Request Info Column */}
                      <div className="select-none space-y-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                              {request.request_number}
                            </span>
                            <span className="font-semibold text-base line-clamp-1">{request.title}</span>
                          </div>
                          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <span>📅 {request.created_at ? format(new Date(request.created_at), "dd/MM/yyyy HH:mm", { locale: vi }) : "N/A"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span>📦 {request.items?.length || 0} vật tư</span>
                            </div>
                            {request.payload?.requestedDate && (
                              <div className="flex items-center gap-2">
                                <span>⏰ Cần trước: {format(new Date(request.payload.requestedDate), "dd/MM/yyyy", { locale: vi })}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {request.items?.length ? (
                          <div className="space-y-2">
                            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              Danh sách vật tư
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {request.items.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs"
                                >
                                  <span className="font-medium">{item.name}</span>
                                  <span className="text-muted-foreground">
                                    · {Number(item.quantity) || 0} {item.unit || ""}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground">Không có vật tư nào.</div>
                        )}
                      </div>

                      {/* Badges Column */}
                      <div className="flex flex-col gap-2 lg:items-center md:flex-row md:gap-3 lg:flex-col">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide lg:hidden">
                          Trạng thái
                        </div>
                        <StatusBadge status={request.status} />
                        <PriorityBadge priority={request.priority} />
                      </div>

                      {/* Actions Column */}
                      <div className="flex flex-col gap-2 lg:items-end md:flex-row md:gap-2 lg:flex-col">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide lg:hidden">
                          Thao tác
                        </div>
                        <div className="flex flex-col gap-2 w-full lg:w-auto">
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="group justify-between gap-2 w-full lg:w-auto [data-state=open]:bg-muted"
                            >
                              <span className="flex items-center gap-2">
                                <Pencil className="h-4 w-4" />
                                Sửa
                              </span>
                              <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                            </Button>
                          </CollapsibleTrigger>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); openDialog(request, "reject") }}
                            disabled={processApproval.isPending}
                            className="justify-start lg:justify-center text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Từ chối
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); openDialog(request, "approve") }}
                            disabled={processApproval.isPending}
                            className="justify-start lg:justify-center"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Phê duyệt
                          </Button>
                        </div>
                      </div>
                    </div>
                    <CollapsibleContent>
                      <div className="px-4 pb-4 border-t bg-muted/20">
                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-3 text-muted-foreground">Chi tiết vật tư yêu cầu</h4>
                          <div className="rounded-md border bg-background overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-muted/50">
                                  <TableHead className="font-medium">Tên vật tư</TableHead>
                                  <TableHead className="font-medium w-[120px]">Số lượng</TableHead>
                                  <TableHead className="font-medium w-[100px]">Đơn vị</TableHead>
                                  <TableHead className="font-medium">Ghi chú</TableHead>
                                  <TableHead className="font-medium w-[100px] text-center">Thao tác</TableHead>
                                </TableRow>
                              </TableHeader>
                            <TableBody>
                              {(request.items || []).map((item) => {
                                const currentQuantity = Number(editedItems[request.id]?.[item.id]?.quantity ?? item.quantity) || 0;
                                const isRejected = currentQuantity === 0;
                                
                                return (
                                  <TableRow 
                                    key={item.id} 
                                    className={`hover:bg-muted/30 transition-colors ${isRejected ? 'opacity-60 bg-red-50/50' : ''}`}
                                  >
                                    <TableCell className="py-3">
                                      <div className="space-y-1">
                                        <Label htmlFor={`name-${item.id}`} className="sr-only">Tên vật tư</Label>
                                        <Input
                                          id={`name-${item.id}`}
                                          value={(editedItems[request.id]?.[item.id]?.name ?? item.name) || ''}
                                          onChange={(e) => {
                                            const value = e.target.value
                                            setEditedItems((prev) => ({
                                              ...prev,
                                              [request.id]: {
                                                ...(prev[request.id] || {}),
                                                [item.id]: {
                                                  ...(prev[request.id]?.[item.id] || {}),
                                                  name: value,
                                                },
                                              },
                                            }))
                                          }}
                                          placeholder="Tên vật tư"
                                          className={`h-9 text-sm focus:ring-2 focus:ring-primary/20 ${isRejected ? 'line-through' : ''}`}
                                          disabled={isRejected}
                                        />
                                        {(() => {
                                          const currentName = (editedItems[request.id]?.[item.id]?.name ?? item.name) || '';
                                          const originalName = item.name || '';
                                          const hasChanged = currentName !== originalName && !isRejected;
                                          
                                          if (hasChanged) {
                                            return (
                                              <div className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded border">
                                                <span className="font-medium">Gốc:</span> {originalName}
                                              </div>
                                            );
                                          }
                                          return null;
                                        })()}
                                      </div>
                                    </TableCell>
                                    <TableCell className="py-3">
                                      <div className="space-y-1">
                                        <Input
                                          type="number"
                                          value={Number(editedItems[request.id]?.[item.id]?.quantity ?? item.quantity) || 0}
                                          onChange={(e) => {
                                            const value = Number(e.target.value)
                                            if (!Number.isNaN(value)) {
                                              setEditedItems((prev) => ({
                                                ...prev,
                                                [request.id]: {
                                                  ...(prev[request.id] || {}),
                                                  [item.id]: {
                                                    ...(prev[request.id]?.[item.id] || {}),
                                                    quantity: value,
                                                  },
                                                },
                                              }))
                                            }
                                          }}
                                          min={0}
                                          step="1"
                                          className={`h-9 text-sm text-center focus:ring-2 focus:ring-primary/20 ${isRejected ? 'bg-red-100 text-red-700' : ''}`}
                                          disabled={isRejected}
                                        />
                                        {(() => {
                                          const currentQuantity = Number(editedItems[request.id]?.[item.id]?.quantity ?? item.quantity) || 0;
                                          const originalQuantity = Number(item.quantity) || 0;
                                          const hasChanged = currentQuantity !== originalQuantity && !isRejected;
                                          
                                          if (hasChanged) {
                                            return (
                                              <div className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded border text-center">
                                                <span className="font-medium">Gốc:</span> {originalQuantity}
                                              </div>
                                            );
                                          }
                                          return null;
                                        })()}
                                      </div>
                                    </TableCell>
                                    <TableCell className="py-3">
                                      <div className="space-y-1">
                                        <Input
                                          value={(editedItems[request.id]?.[item.id]?.unit ?? item.unit) || ''}
                                          onChange={(e) => {
                                            const value = e.target.value
                                            setEditedItems((prev) => ({
                                              ...prev,
                                              [request.id]: {
                                                ...(prev[request.id] || {}),
                                                [item.id]: {
                                                  ...(prev[request.id]?.[item.id] || {}),
                                                  unit: value,
                                                },
                                              },
                                            }))
                                          }}
                                          placeholder="Đơn vị"
                                          className={`h-9 text-sm focus:ring-2 focus:ring-primary/20 ${isRejected ? 'line-through' : ''}`}
                                          disabled={isRejected}
                                        />
                                        {(() => {
                                          const currentUnit = (editedItems[request.id]?.[item.id]?.unit ?? item.unit) || '';
                                          const originalUnit = item.unit || '';
                                          const hasChanged = currentUnit !== originalUnit && !isRejected;
                                          
                                          if (hasChanged) {
                                            return (
                                              <div className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded border">
                                                <span className="font-medium">Gốc:</span> {originalUnit}
                                              </div>
                                            );
                                          }
                                          return null;
                                        })()}
                                      </div>
                                    </TableCell>
                                    <TableCell className="py-3">
                                      <div className="space-y-1">
                                        <Textarea
                                          value={(editedItems[request.id]?.[item.id]?.notes ?? item.notes) || ''}
                                          onChange={(e) => {
                                            const value = e.target.value
                                            setEditedItems((prev) => ({
                                              ...prev,
                                              [request.id]: {
                                                ...(prev[request.id] || {}),
                                                [item.id]: {
                                                  ...(prev[request.id]?.[item.id] || {}),
                                                  notes: value,
                                                },
                                              },
                                            }))
                                          }}
                                          placeholder="Ghi chú..."
                                          rows={2}
                                          className="text-sm resize-none focus:ring-2 focus:ring-primary/20"
                                          disabled={isRejected}
                                        />
                                        {(() => {
                                          const currentNotes = (editedItems[request.id]?.[item.id]?.notes ?? item.notes) || '';
                                          const originalNotes = item.notes || '';
                                          const hasChanged = currentNotes !== originalNotes && !isRejected;
                                          
                                          if (hasChanged) {
                                            return (
                                              <div className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded border">
                                                <span className="font-medium">Gốc:</span> {originalNotes || '(Trống)'}
                                              </div>
                                            );
                                          }
                                          return null;
                                        })()}
                                      </div>
                                    </TableCell>
                                  <TableCell className="py-3 text-center">
                                    {(() => {
                                      const currentQuantity = Number(editedItems[request.id]?.[item.id]?.quantity ?? item.quantity) || 0;
                                      const isRejected = currentQuantity === 0;
                                      
                                      return (
                                        <div className="flex flex-col gap-1">
                                          <Button
                                            variant={isRejected ? "default" : "destructive"}
                                            size="sm"
                                            onClick={() => {
                                              const newQuantity = isRejected ? (item.quantity || 1) : 0;
                                              setEditedItems((prev) => ({
                                                ...prev,
                                                [request.id]: {
                                                  ...(prev[request.id] || {}),
                                                  [item.id]: {
                                                    ...(prev[request.id]?.[item.id] || {}),
                                                    quantity: newQuantity,
                                                  },
                                                },
                                              }))
                                            }}
                                            className="h-8 text-xs"
                                            title={isRejected ? "Khôi phục vật tư" : "Từ chối vật tư"}
                                          >
                                            {isRejected ? (
                                              <>
                                                <RefreshCw className="h-3 w-3 mr-1" />
                                                Khôi phục
                                              </>
                                            ) : (
                                              <>
                                                <X className="h-3 w-3 mr-1" />
                                                Từ chối
                                              </>
                                            )}
                                          </Button>
                                          {isRejected && (
                                            <span className="text-xs text-red-600 font-medium">
                                              Đã từ chối
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </TableCell>
                                </TableRow>
                                );
                              })}
                            </TableBody>
                            </Table>
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Approve/Reject Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogAction === "approve" ? "Xác nhận phê duyệt" : "Xác nhận từ chối"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              {selectedRequest ? (
                <>
                  Bạn đang {dialogAction === "approve" ? "phê duyệt" : "từ chối"} yêu cầu
                  <span className="mx-1 font-medium">{selectedRequest.title}</span>
                  (Mã: <span className="font-mono">{selectedRequest.request_number}</span>)
                </>
              ) : null}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ghi chú (không bắt buộc)</label>
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder={dialogAction === "reject" ? "Lý do từ chối (khuyến nghị)" : "Ghi chú cho người tạo (nếu có)"}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={processApproval.isPending}>
              Hủy
            </Button>
            {dialogAction === "reject" ? (
              <Button variant="destructive" onClick={handleConfirm} disabled={processApproval.isPending}>
                {processApproval.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <X className="h-4 w-4 mr-2" />
                )}
                Từ chối
              </Button>
            ) : (
              <Button onClick={handleConfirm} disabled={processApproval.isPending}>
                {processApproval.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Phê duyệt
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
