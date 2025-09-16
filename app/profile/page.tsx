'use client'

import { useState, useEffect } from 'react'
import { useUserProfile } from '@/hooks/use-profile'
import { profileStore } from '@/lib/stores/profile-store'
import { updateProfile } from '@/lib/services/profile-service'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Loader2, Save, RefreshCw, User, Mail, Phone, Building, UserCheck } from 'lucide-react'
import { toast } from 'sonner'

export default function ProfilePage() {
  const { profile, isLoading, error, refetch } = useUserProfile()
  const updateProfileStore = profileStore.use.updateProfile()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    employee_code: '',
  })

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        employee_code: profile.employee_code || '',
      })
    }
  }, [profile])

  const handleEdit = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        employee_code: profile.employee_code || '',
      })
      setIsEditing(true)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        employee_code: profile.employee_code || '',
      })
    }
  }

  const handleSave = async () => {
    if (!profile) return

    setIsSaving(true)
    try {
      const updatedProfile = await updateProfile(profile.id, formData)
      updateProfileStore(updatedProfile)
      setIsEditing(false)
      toast.success("Cập nhật hồ sơ thành công")
    } catch (error) {
      toast.error("Không thể cập nhật hồ sơ")
      console.error('Profile update error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleRefresh = async () => {
    try {
      await refetch()
      toast.success("Làm mới hồ sơ thành công")
    } catch (error) {
      toast.error("Không thể làm mới hồ sơ")
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="text-muted-foreground">Đang tải hồ sơ...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="text-red-500 text-lg font-semibold">Lỗi tải hồ sơ</div>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Thử lại
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!profile) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="text-muted-foreground text-lg">Không tìm thấy hồ sơ</div>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Tải lại
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  const initials = profile.full_name
    ?.split(' ')
    ?.map(name => name[0])
    ?.join('')
    ?.substring(0, 2)
    ?.toUpperCase() || 'U'

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Hồ sơ cá nhân</h1>
            <p className="text-muted-foreground">
              Quản lý thông tin cá nhân của bạn
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Làm mới
            </Button>
            {!isEditing && (
              <Button onClick={handleEdit} size="sm">
                Chỉnh sửa
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Summary Card */}
          <Card className="md:col-span-1">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Avatar className="h-24 w-24">
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-xl">{profile.full_name}</CardTitle>
              <CardDescription>{profile.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center">
                <Badge variant={profile.is_active ? "default" : "secondary"}>
                  {profile.is_active ? "Hoạt động" : "Không hoạt động"}
                </Badge>
              </div>
              
              {profile.department && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Phòng ban</p>
                  <p className="font-medium">{profile.department.name}</p>
                </div>
              )}
              
              {profile.role && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Chức vụ</p>
                  <p className="font-medium">{profile.role.name}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Profile Details Card */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Thông tin chi tiết
              </CardTitle>
              <CardDescription>
                Thông tin cá nhân và liên hệ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Họ và tên</Label>
                  {isEditing ? (
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="Nhập họ và tên"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{profile.full_name || 'Chưa cập nhật'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{profile.email}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Nhập số điện thoại"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{profile.phone || 'Chưa cập nhật'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employee_code">Mã nhân viên</Label>
                  {isEditing ? (
                    <Input
                      id="employee_code"
                      value={formData.employee_code}
                      onChange={(e) => setFormData(prev => ({ ...prev, employee_code: e.target.value }))}
                      placeholder="Nhập mã nhân viên"
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                      <span>{profile.employee_code || 'Chưa cập nhật'}</span>
                    </div>
                  )}
                </div>
              </div>

              {isEditing && (
                <>
                  <Separator />
                  <div className="flex gap-2 justify-end">
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      disabled={isSaving}
                    >
                      Hủy
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Đang lưu...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Lưu thay đổi
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Thông tin tổ chức
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Phòng ban</p>
                <p className="font-medium">{profile.department?.name || 'Chưa phân công'}</p>
                {profile.department?.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {profile.department.description}
                  </p>
                )}
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Chức vụ</p>
                <p className="font-medium">{profile.role?.name || 'Chưa phân quyền'}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Trạng thái</p>
                <Badge variant={profile.is_active ? "default" : "secondary"}>
                  {profile.is_active ? "Đang hoạt động" : "Tạm ngưng"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
