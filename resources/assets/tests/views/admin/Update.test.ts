import Vue from 'vue'
import { mount } from '@vue/test-utils'
import { flushPromises } from '../../utils'
import { showModal } from '@/scripts/notify'
import Update from '@/views/admin/Update.vue'

jest.mock('@/scripts/notify')

afterEach(() => {
  window.blessing.extra = { canUpdate: true }
})
test('button should be disabled if update is unavailable', () => {
  window.blessing.extra = { canUpdate: false }
  const wrapper = mount(Update)
  expect(wrapper.find('button').attributes('disabled')).toBe('disabled')
})

test('perform update', async () => {
  window.$ = jest.fn(() => ({
    modal() {},
  }))
  Vue.prototype.$http.post
    .mockResolvedValueOnce({ code: 1, message: 'fail' })
    .mockResolvedValue({})
  const wrapper = mount(Update)
  const button = wrapper.find('button')

  button.trigger('click')
  await flushPromises()
  expect(showModal).toBeCalledWith({
    mode: 'alert',
    text: 'fail',
    type: 'danger',
    okButtonType: 'outline-light',
  })

  button.trigger('click')
  jest.runOnlyPendingTimers()
  await flushPromises()
  expect(Vue.prototype.$http.get).toBeCalledWith(
    '/admin/update/download',
    { action: 'progress' },
  )
  expect(Vue.prototype.$http.post).toBeCalledWith(
    '/admin/update/download',
    { action: 'download' },
  )
})

test('polling for querying download progress', async () => {
  const wrapper = mount<Vue & { polling(): Promise<void> }>(Update)
  wrapper.setData({ updating: true })
  await wrapper.vm.polling()
  expect(Vue.prototype.$http.get).toBeCalledWith(
    '/admin/update/download',
    { action: 'progress' },
  )
})
