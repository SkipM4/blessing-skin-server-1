import Vue from 'vue'
import { mount } from '@vue/test-utils'
import { flushPromises } from '../utils'
import { showModal, toast } from '@/scripts/notify'
import SkinLibItem from '@/components/SkinLibItem.vue'

jest.mock('@/scripts/notify')

test('urls', () => {
  const wrapper = mount(SkinLibItem, {
    propsData: { tid: 1 },
  })
  expect(wrapper.find('a').attributes('href')).toBe('/skinlib/show/1')
  expect(wrapper.find('img').attributes('src')).toBe('/preview/1.png')
})

test('render basic information', () => {
  const wrapper = mount(SkinLibItem, {
    propsData: {
      tid: 1,
      name: 'test',
      type: 'steve',
    },
  })
  expect(wrapper.text()).toContain('test')
  expect(wrapper.text()).toContain('skinlib.filter.steve')
})

test('anonymous user', () => {
  const wrapper = mount(SkinLibItem, {
    propsData: { anonymous: true },
  })
  const button = wrapper.find('.btn-like')
  expect(button.attributes('title')).toBe('skinlib.anonymous')
  button.trigger('click')
  expect(Vue.prototype.$http.post).not.toBeCalled()
})

test('private texture', () => {
  const wrapper = mount(SkinLibItem, {
    propsData: { isPublic: false },
  })
  expect(wrapper.text()).toContain('skinlib.private')

  wrapper.setProps({ isPublic: true })
  expect(wrapper.text()).not.toContain('skinlib.private')
})

test('liked state', () => {
  const wrapper = mount(SkinLibItem, {
    propsData: { liked: true, anonymous: false },
  })
  const button = wrapper.find('.btn-like')

  expect(button.attributes('title')).toBe('skinlib.removeFromCloset')
  expect(button.classes('liked')).toBeTrue()

  wrapper.setProps({ liked: false })
  expect(button.attributes('title')).toBe('skinlib.addToCloset')
  expect(button.classes('liked')).toBeFalse()
})

test('remove from closet', async () => {
  Vue.prototype.$http.post.mockResolvedValue({ code: 0 })
  showModal.mockResolvedValue({ value: '' })
  const wrapper = mount(SkinLibItem, {
    propsData: {
      tid: 1, liked: true, anonymous: false,
    },
  })
  wrapper.find('.btn-like').trigger('click')
  await flushPromises()
  expect(wrapper.emitted('like-toggled')[0]).toEqual([false])
})

test('add to closet', async () => {
  Vue.prototype.$http.post
    .mockResolvedValueOnce({ code: 1, message: '1' })
    .mockResolvedValue({ code: 0 })
  showModal
    .mockRejectedValueOnce(null)
    .mockResolvedValue({ value: 'name' })
  const wrapper = mount(SkinLibItem, {
    propsData: {
      tid: 1, liked: false, anonymous: false,
    },
  })
  const button = wrapper.find('.btn-like')

  button.trigger('click')
  expect(Vue.prototype.$http.post).not.toBeCalled()

  button.trigger('click')
  await flushPromises()
  expect(Vue.prototype.$http.post).toBeCalledWith(
    '/user/closet/add',
    { tid: 1, name: 'name' },
  )
  expect(toast.error).toBeCalledWith('1')

  button.trigger('click')
  await flushPromises()
  expect(wrapper.emitted('like-toggled')[0]).toEqual([true])
})

test('truncate too long texture name', () => {
  const wrapper = mount(SkinLibItem, {
    propsData: {
      name: 'very-very-long-texture-name',
    },
  })
  expect(wrapper.text()).toContain('very-very-long-...')
})
