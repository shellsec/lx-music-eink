import { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react'
import { AppState, Image, ScrollView, View } from 'react-native'
import Dialog, { type DialogType } from '@/components/common/Dialog'
import Button from '@/components/common/Button'
import Text from '@/components/common/Text'
import { useTheme } from '@/store/theme/hook'
import { startSourceWeb } from '@/utils/nativeModules/sourceWeb'

export interface SourceWebConfigType { show: () => void }
type Session = Awaited<ReturnType<typeof startSourceWeb>>

export default forwardRef<SourceWebConfigType, {}>((props, ref) => {
  const theme = useTheme()
  const dialog = useRef<DialogType>(null)
  const active = useRef<Session | null>(null)
  const generation = useRef(0)
  const [visible, setVisible] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const stop = async() => {
    generation.current++
    const current = active.current
    active.current = null
    setSession(null)
    await current?.close()
  }
  useEffect(() => () => {
    generation.current++
    void active.current?.close()
  }, [])
  useImperativeHandle(ref, () => ({
    show() {
      setVisible(true)
      setError('')
      requestAnimationFrame(() => { dialog.current?.setVisible(true) })
    },
  }))

  const start = async() => {
    setBusy(true)
    setError('')
    const request = ++generation.current
    try {
      const current = await startSourceWeb(() => {
        void stop()
        setError('应用已退到后台，HTTP 网页已关闭。需要时可重新开启。')
      })
      if (request !== generation.current || AppState.currentState !== 'active') { await current.close(); return }
      active.current = current
      setSession(current)
    } catch (failure: unknown) {
      setError(failure instanceof Error ? failure.message : String(failure))
    } finally { setBusy(false) }
  }

  return visible ? <Dialog ref={dialog} title="HTTP 网页配置" onHide={() => { void stop() }}>
    <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ padding: 18, gap: 12 }}>
      <Text>让另一部手机帮你填写音源配置</Text>
      <Text size={13}>两台设备连接同一 Wi-Fi。开启后，另一部手机用系统相机或扫一扫打开二维码，即可在浏览器中填写音源链接、上传脚本或保存订阅地址。</Text>
      {session ? <>
        <Image source={{ uri: session.qrImage }} style={{ width: '100%', maxWidth: 220, aspectRatio: 1, alignSelf: 'center', backgroundColor: '#fff' }} accessibilityLabel="手机扫码打开网页配置" />
        <Text selectable size={13}>{session.url}</Text>
        <Text size={12}>也可以在手机或电脑浏览器手动输入上方地址。此二维码仅在当前网页配置开启时有效。</Text>
      </> : null}
      {error ? <Text size={13}>{error}</Text> : null}
      <View>
        <Button style={{ padding: 12, borderWidth: 1, borderColor: theme['c-primary-font'], borderRadius: 4 }} disabled={busy} onPress={() => { if (session) void stop(); else void start() }}>
          <Text>{busy ? '正在开启…' : session ? '关闭 HTTP 网页' : '开启 HTTP 网页'}</Text>
        </Button>
      </View>
      <Text size={12}>完成后请关闭。关闭窗口或应用退到后台时，网页服务会停止。设备无需摄像头。</Text>
    </ScrollView>
  </Dialog> : null
})
