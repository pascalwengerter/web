import CreateLinkModal from '../../../src/components/CreateLinkModal.vue'
import { defaultComponentMocks, defaultPlugins, mount } from 'web-test-helpers'
import { mock } from 'vitest-mock-extended'
import { PasswordPolicyService } from '../../../src/services'
import { usePasswordPolicyService } from '../../../src/composables/passwordPolicyService'
import { AbilityRule, LinkShare, Resource, ShareRole } from '@ownclouders/web-client/src/helpers'
import { PasswordPolicy } from 'design-system/src/helpers'
import { useEmbedMode } from '../../../src/composables/embedMode'
import { useLinkTypes } from '../../../src/composables/links'
import { ref } from 'vue'
import { CapabilityStore, useSharesStore } from '../../../src/composables/piniaStores'
import { SharingLinkType } from '@ownclouders/web-client/src/generated'

vi.mock('../../../src/composables/embedMode')
vi.mock('../../../src/composables/passwordPolicyService')
vi.mock('../../../src/composables/links', async (importOriginal) => ({
  ...(await importOriginal<any>()),
  useLinkTypes: vi.fn()
}))

const selectors = {
  passwordInput: '.link-modal-password-input',
  roleElements: '.role-dropdown-list li',
  contextMenuToggle: '#link-modal-context-menu-toggle',
  confirmBtn: '.link-modal-confirm',
  cancelBtn: '.link-modal-cancel'
}

describe('CreateLinkModal', () => {
  describe('password input', () => {
    it('should be rendered', () => {
      const { wrapper } = getWrapper()
      expect(wrapper.find(selectors.passwordInput).exists()).toBeTruthy()
    })
    it('should be disabled for internal links', () => {
      const { wrapper } = getWrapper({ defaultLinkType: SharingLinkType.Internal })
      expect(wrapper.find(selectors.passwordInput).attributes('disabled')).toBeTruthy()
    })
    it('should not be rendered if user cannot create public links', () => {
      const { wrapper } = getWrapper({
        userCanCreatePublicLinks: false,
        availableLinkTypes: [SharingLinkType.Internal],
        defaultLinkType: SharingLinkType.Internal
      })
      expect(wrapper.find(selectors.passwordInput).exists()).toBeFalsy()
    })
  })
  describe('link role select', () => {
    it('lists all types as roles', () => {
      const availableLinkTypes = [
        SharingLinkType.View,
        SharingLinkType.Internal,
        SharingLinkType.Edit
      ]
      const { wrapper } = getWrapper({ availableLinkTypes })

      expect(wrapper.findAll(selectors.roleElements).length).toBe(availableLinkTypes.length)
    })
  })
  describe('context menu', () => {
    it('should display the button to toggle the context menu', () => {
      const { wrapper } = getWrapper()
      expect(wrapper.find(selectors.contextMenuToggle).exists()).toBeTruthy()
    })
    it('should not display the button to toggle the context menu if user cannot create public links', () => {
      const { wrapper } = getWrapper({
        userCanCreatePublicLinks: false,
        availableLinkTypes: [SharingLinkType.Internal],
        defaultLinkType: SharingLinkType.Internal
      })
      expect(wrapper.find(selectors.contextMenuToggle).exists()).toBeFalsy()
    })
  })
  describe('method "confirm"', () => {
    it('shows an error if a password is enforced but empty', async () => {
      vi.spyOn(console, 'error').mockImplementation(undefined)
      const { wrapper } = getWrapper({ passwordEnforced: true })
      try {
        await wrapper.vm.onConfirm()
      } catch (error) {}

      expect(wrapper.vm.password.error).toBeDefined()
    })
    it('does not create links when the password policy is not fulfilled', async () => {
      vi.spyOn(console, 'error').mockImplementation(undefined)
      const callbackFn = vi.fn()
      const { wrapper } = getWrapper({ passwordPolicyFulfilled: false, callbackFn })
      try {
        await wrapper.vm.onConfirm()
      } catch (error) {}

      expect(callbackFn).not.toHaveBeenCalled()
    })
    it('creates links for all resources', async () => {
      const callbackFn = vi.fn()
      const resources = [mock<Resource>({ isFolder: false }), mock<Resource>({ isFolder: false })]
      const { wrapper } = getWrapper({ resources, callbackFn })
      await wrapper.vm.onConfirm()

      const { addLink } = useSharesStore()
      expect(addLink).toHaveBeenCalledTimes(resources.length)
      expect(callbackFn).toHaveBeenCalledTimes(1)
    })
    it('emits event in embed mode including the created links', async () => {
      const resources = [mock<Resource>({ isFolder: false })]
      const { wrapper, mocks } = getWrapper({ resources, embedModeEnabled: true })
      const link = mock<LinkShare>({ webUrl: 'someurl' })

      const { addLink } = useSharesStore()
      ;(addLink as any).mockResolvedValue(link)
      await wrapper.vm.onConfirm()
      expect(mocks.postMessageMock).toHaveBeenCalledWith('owncloud-embed:share', [link.webUrl])
    })
    it('shows error messages for links that failed to be created', async () => {
      const consoleMock = vi.fn(() => undefined)
      vi.spyOn(console, 'error').mockImplementation(consoleMock)
      const resources = [mock<Resource>({ isFolder: false })]
      const { wrapper } = getWrapper({ resources })

      const { addLink } = useSharesStore()
      ;(addLink as any).mockRejectedValue({ response: {} })
      await wrapper.vm.onConfirm()

      expect(consoleMock).toHaveBeenCalledTimes(1)
    })
    it('calls the callback at the end if given', async () => {
      const resources = [mock<Resource>({ isFolder: false })]
      const callbackFn = vi.fn()
      const { wrapper } = getWrapper({ resources, callbackFn })
      await wrapper.vm.onConfirm()
      expect(callbackFn).toHaveBeenCalledTimes(1)
    })
    it.each([true, false])(
      'correctly passes the quicklink property to createLink',
      async (isQuickLink) => {
        const resources = [mock<Resource>({ isFolder: false })]
        const { wrapper } = getWrapper({ resources, isQuickLink })
        await wrapper.vm.onConfirm()

        const { addLink } = useSharesStore()
        expect(addLink).toHaveBeenCalledWith(
          expect.objectContaining({
            options: expect.objectContaining({ '@libre.graph.quickLink': isQuickLink })
          })
        )
      }
    )
  })
})

function getWrapper({
  resources = [],
  defaultLinkType = SharingLinkType.View,
  userCanCreatePublicLinks = true,
  passwordEnforced = false,
  passwordPolicyFulfilled = true,
  embedModeEnabled = false,
  callbackFn = undefined,
  isQuickLink = false,
  availableLinkTypes = [SharingLinkType.Internal, SharingLinkType.View]
}: {
  resources?: Resource[]
  defaultLinkType?: SharingLinkType
  userCanCreatePublicLinks?: boolean
  passwordEnforced?: boolean
  passwordPolicyFulfilled?: boolean
  embedModeEnabled?: boolean
  callbackFn?: any
  isQuickLink?: boolean
  availableLinkTypes?: SharingLinkType[]
} = {}) {
  vi.mocked(usePasswordPolicyService).mockReturnValue(
    mock<PasswordPolicyService>({
      getPolicy: () => mock<PasswordPolicy>({ check: () => passwordPolicyFulfilled })
    })
  )
  vi.mocked(useLinkTypes).mockReturnValue(
    mock<ReturnType<typeof useLinkTypes>>({
      defaultLinkType: ref(defaultLinkType),
      getAvailableLinkTypes: () => availableLinkTypes,
      getLinkRoleByType: () => mock<ShareRole>(),
      isPasswordEnforcedForLinkType: () => passwordEnforced
    })
  )

  const postMessageMock = vi.fn()
  vi.mocked(useEmbedMode).mockReturnValue(
    mock<ReturnType<typeof useEmbedMode>>({
      isEnabled: ref(embedModeEnabled),
      postMessage: postMessageMock
    })
  )

  const mocks = { ...defaultComponentMocks(), postMessageMock }

  const abilities = [] as AbilityRule[]
  if (userCanCreatePublicLinks) {
    abilities.push({ action: 'create-all', subject: 'PublicLink' })
  }

  const capabilities = {
    files_sharing: {
      public: {
        expire_date: {},
        can_edit: true,
        can_contribute: true,
        alias: true,
        password: { enforced_for: { read_only: passwordEnforced } }
      }
    }
  } satisfies Partial<CapabilityStore['capabilities']>

  return {
    mocks,
    wrapper: mount(CreateLinkModal, {
      props: {
        resources,
        isQuickLink,
        callbackFn,
        modal: undefined
      },
      global: {
        plugins: [
          ...defaultPlugins({ abilities, piniaOptions: { capabilityState: { capabilities } } })
        ],
        mocks,
        provide: mocks,
        stubs: { OcTextInput: true, OcDatepicker: true, OcButton: true }
      }
    })
  }
}
