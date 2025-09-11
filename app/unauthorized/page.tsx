import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShieldAlert } from "lucide-react"
import Link from "next/link"

export default function UnauthorizedPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted/50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto bg-destructive/10 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Truy cập bị từ chối</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Bạn không có quyền truy cập vào trang này. 
            Nếu bạn tin rằng đây là một lỗi, vui lòng liên hệ với quản trị viên hệ thống.
          </p>
          <div className="flex flex-col gap-2 pt-4">
            <Button asChild>
              <Link href="/">Quay về trang chủ</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">Đi đến Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}